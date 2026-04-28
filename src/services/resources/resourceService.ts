import * as FileSystem from 'expo-file-system/legacy';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { Platform } from 'react-native';

import { t } from '@/src/i18n';
import type { HomeResourceItem } from '@/src/types/domain';

type ResourceMockDefinition = {
  id: string;
  titleKey: string;
  fileType: HomeResourceItem['fileType'];
  previewUrl: string;
  downloadUrl: string;
};

const HOME_RESOURCE_MOCKS: ResourceMockDefinition[] = [
  {
    id: 'resource-pdf-guide',
    titleKey: 'home.resources.items.pdfGuide',
    fileType: 'pdf',
    previewUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    id: 'resource-docx-template',
    titleKey: 'home.resources.items.docxTemplate',
    fileType: 'docx',
    previewUrl: 'https://filesamples.com/samples/document/docx/sample3.docx',
    downloadUrl: 'https://filesamples.com/samples/document/docx/sample3.docx',
  },
  {
    id: 'resource-image-notes',
    titleKey: 'home.resources.items.imageNotes',
    fileType: 'image',
    previewUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/3f/Fronalpstock_big.jpg',
    downloadUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/3f/Fronalpstock_big.jpg',
  }
];

export type ResourceDownloadProgress = {
  progress: number;
  totalBytesWritten: number;
  totalBytesExpected: number;
};

export type DownloadResult =
  | { status: 'completed'; localUri: string }
  | { status: 'login_required' }
  | { status: 'cancelled' }
  | { status: 'already_exists'; localUri: string };

export class ResourceDownloadError extends Error {
  constructor(
    message: string,
    public readonly reason: 'network' | 'storage' | 'not_found' | 'unknown',
  ) {
    super(message);
    this.name = 'ResourceDownloadError';
  }
}

function classifyError(error: unknown): ResourceDownloadError['reason'] {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();

    if (
      msg.includes('network') ||
      msg.includes('timeout') ||
      msg.includes('unreachable') ||
      msg.includes('dns')
    ) {
      return 'network';
    }

    if (
      msg.includes('space') ||
      msg.includes('storage') ||
      msg.includes('disk') ||
      msg.includes('quota')
    ) {
      return 'storage';
    }

    if (msg.includes('404') || msg.includes('not found') || msg.includes('not_found')) {
      return 'not_found';
    }
  }

  return 'unknown';
}

export async function listHomeResources(): Promise<HomeResourceItem[]> {
  return HOME_RESOURCE_MOCKS.map((resource) => ({
    id: resource.id,
    title: t(resource.titleKey),
    fileType: resource.fileType,
    previewUrl: resource.previewUrl,
    downloadUrl: resource.downloadUrl,
  }));
}

export async function openResourcePreview(resource: HomeResourceItem) {
  await WebBrowser.openBrowserAsync(resource.previewUrl, {
    presentationStyle:
      Platform.OS === 'ios' ? WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET : undefined,
  });
}

export function createResourceDownload(
  resource: HomeResourceItem,
  options: {
    isAuthenticated: boolean;
    onProgress?: (progress: ResourceDownloadProgress) => void;
  },
): { start: () => Promise<DownloadResult>; cancel: () => Promise<void> } {
  const { isAuthenticated, onProgress } = options;
  let downloadTask: FileSystem.DownloadResumable | null = null;
  let cancelled = false;

  async function start(): Promise<DownloadResult> {
    if (!isAuthenticated) {
      return { status: 'login_required' };
    }

    const baseDirectory = await ensureDownloadDirectory();
    const localUri = `${baseDirectory}${createResourceFileName(resource)}`;

    const fileInfo = await FileSystem.getInfoAsync(localUri);

    if (fileInfo.exists) {
      return { status: 'already_exists', localUri };
    }

    downloadTask = FileSystem.createDownloadResumable(
      resource.downloadUrl,
      localUri,
      {},
      (event) => {
        if (cancelled) return;

        const totalBytesExpected = event.totalBytesExpectedToWrite;
        const progress =
          totalBytesExpected > 0
            ? Math.min(100, Math.round((event.totalBytesWritten / totalBytesExpected) * 100))
            : -1;

        onProgress?.({
          progress,
          totalBytesWritten: event.totalBytesWritten,
          totalBytesExpected,
        });
      },
    );

    try {
      const result = await downloadTask.downloadAsync();

      if (cancelled) {
        await FileSystem.deleteAsync(localUri, { idempotent: true });
        return { status: 'cancelled' };
      }

      if (!result?.uri) {
        throw new Error('home.resources.downloadFailed');
      }

      onProgress?.({
        progress: 100,
        totalBytesWritten: 0,
        totalBytesExpected: 0,
      });

      return { status: 'completed', localUri: result.uri };
    } catch (error) {
      await FileSystem.deleteAsync(localUri, { idempotent: true });

      if (cancelled) {
        return { status: 'cancelled' };
      }

      throw new ResourceDownloadError(
        error instanceof Error ? error.message : 'home.resources.downloadFailed',
        classifyError(error),
      );
    }
  }

  async function cancel(): Promise<void> {
    cancelled = true;

    if (downloadTask) {
      try {
        await downloadTask.cancelAsync();
      } catch {
        // cancelAsync may throw if task has already completed — safe to ignore
      }
    }
  }

  return { start, cancel };
}

export async function openDownloadedResource(localUri: string) {
  const uri = Platform.OS === 'android' ? await FileSystem.getContentUriAsync(localUri) : localUri;

  await Linking.openURL(uri);
}

export async function checkResourceFileExists(resource: HomeResourceItem): Promise<{
  exists: boolean;
  localUri: string;
}> {
  if (!FileSystem.documentDirectory) {
    return { exists: false, localUri: '' };
  }

  const baseDirectory = `${FileSystem.documentDirectory}downloads/`;
  const localUri = `${baseDirectory}${createResourceFileName(resource)}`;
  const fileInfo = await FileSystem.getInfoAsync(localUri);

  return { exists: fileInfo.exists, localUri };
}

async function ensureDownloadDirectory() {
  if (!FileSystem.documentDirectory) {
    throw new Error('home.resources.downloadFailed');
  }

  const targetDirectory = `${FileSystem.documentDirectory}downloads/`;
  await FileSystem.makeDirectoryAsync(targetDirectory, { intermediates: true });
  return targetDirectory;
}

function createResourceFileName(resource: HomeResourceItem) {
  const extension = getResourceExtension(resource.fileType);
  const safeTitle = resource.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '');

  return `${safeTitle || resource.id}-${resource.id}.${extension}`;
}

function getResourceExtension(fileType: HomeResourceItem['fileType']) {
  switch (fileType) {
    case 'pdf':
      return 'pdf';
    case 'docx':
      return 'docx';
    case 'image':
      return 'jpg';
    default:
      return 'bin';
  }
}
