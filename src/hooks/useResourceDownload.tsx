import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { useAuthStore } from '@/src/stores/authStore';
import {
  checkResourceFileExists,
  createResourceDownload,
  openDownloadedResource,
  openResourcePreview,
  ResourceDownloadError,
} from '@/src/services/resources/resourceService';
import type { HomeResourceItem } from '@/src/types/domain';

type ResourceDownloadUiState = {
  status: 'idle' | 'downloading' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  localUri?: string;
  errorMessage?: string;
};

export function useResourceDownload(resources: HomeResourceItem[]) {
  const { t } = useTranslation();
  const [resourceStates, setResourceStates] = useState<Record<string, ResourceDownloadUiState>>({});
  const [previewingResources, setPreviewingResources] = useState<Set<string>>(new Set());
  const cancelRef = useRef<Map<string, () => Promise<void>>>(new Map());
  const animRef = useRef<Map<string, Animated.Value>>(new Map());
  const queueRef = useRef<Array<() => Promise<void>>>([]);
  const processingRef = useRef(false);

  useEffect(() => {
    for (const resource of resources) {
      checkResourceFileExists(resource).then(({ exists, localUri }) => {
        if (exists) {
          setResourceStates((prev) => ({
            ...prev,
            [resource.id]: {
              status: 'completed',
              progress: 100,
              localUri,
            },
          }));
        }
      });
    }
  }, [resources]);

  useEffect(() => {
    return () => {
      for (const cancel of cancelRef.current.values()) {
        cancel();
      }
    };
  }, []);

  const processQueue = useCallback(async () => {
    if (processingRef.current || queueRef.current.length === 0) return;

    processingRef.current = true;

    while (queueRef.current.length > 0) {
      const task = queueRef.current.shift();

      if (task) {
        await task();
      }
    }

    processingRef.current = false;
  }, []);

  function enqueue(task: () => Promise<void>) {
    queueRef.current.push(task);
    processQueue();
  }

  function getAnim(resourceId: string) {
    const existing = animRef.current.get(resourceId);

    if (existing) return existing;

    const anim = new Animated.Value(0);
    animRef.current.set(resourceId, anim);
    return anim;
  }

  function startAnim(resourceId: string) {
    const anim = getAnim(resourceId);
    anim.setValue(0);
    Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ).start();
  }

  function stopAnim(resourceId: string) {
    const anim = animRef.current.get(resourceId);

    if (anim) {
      anim.stopAnimation();
      animRef.current.delete(resourceId);
    }
  }

  function getErrorMessage(reason: ResourceDownloadError['reason']): string {
    switch (reason) {
      case 'network':
        return t('home.resources.errorNetwork');
      case 'storage':
        return t('home.resources.errorStorage');
      case 'not_found':
        return t('home.resources.errorNotFound');
      default:
        return t('home.resources.downloadFailed');
    }
  }

  const handlePreview = useCallback(
    async (resource: HomeResourceItem) => {
      try {
        setPreviewingResources((prev) => new Set(prev).add(resource.id));
        setResourceStates((prev) => {
          const current = prev[resource.id];

          if (current?.errorMessage) {
            return {
              ...prev,
              [resource.id]: {
                ...current,
                errorMessage: undefined,
                status: current.status === 'failed' ? 'idle' : current.status,
              },
            };
          }

          return prev;
        });
        await openResourcePreview(resource);
      } catch {
        setResourceStates((prev) => ({
          ...prev,
          [resource.id]: {
            ...prev[resource.id],
            status: prev[resource.id]?.status === 'completed' ? 'completed' : 'failed',
            progress: prev[resource.id]?.progress ?? 0,
            localUri: prev[resource.id]?.localUri,
            errorMessage: t('home.resources.previewFailed'),
          },
        }));
      } finally {
        setPreviewingResources((prev) => {
          const next = new Set(prev);
          next.delete(resource.id);
          return next;
        });
      }
    },
    [t],
  );

  const handleDownload = useCallback(
    (resource: HomeResourceItem) => {
      setResourceStates((prev) => ({
        ...prev,
        [resource.id]: {
          status: 'downloading',
          progress: 0,
        },
      }));

      const task = async () => {
        try {
          const isAuthenticated = useAuthStore.getState().status === 'authenticated';
          const { start, cancel } = createResourceDownload(resource, {
            isAuthenticated,
            onProgress: (progress) => {
              setResourceStates((prev) => {
                const current = prev[resource.id];

                if (current?.status !== 'downloading') return prev;

                return {
                  ...prev,
                  [resource.id]: {
                    ...current,
                    progress: progress.progress,
                  },
                };
              });
            },
          });

          cancelRef.current.set(resource.id, cancel);

          const result = await start();
          cancelRef.current.delete(resource.id);
          stopAnim(resource.id);

          if (result.status === 'login_required') {
            setResourceStates((prev) => ({
              ...prev,
              [resource.id]: { status: 'idle', progress: 0 },
            }));
            const { router } = await import('expo-router');
            router.push('/login');
            return;
          }

          if (result.status === 'cancelled') {
            setResourceStates((prev) => ({
              ...prev,
              [resource.id]: { status: 'cancelled', progress: 0 },
            }));
            return;
          }

          setResourceStates((prev) => ({
            ...prev,
            [resource.id]: {
              status: 'completed',
              progress: 100,
              localUri: result.localUri,
            },
          }));
        } catch (error) {
          stopAnim(resource.id);
          const reason = error instanceof ResourceDownloadError ? error.reason : 'unknown';

          setResourceStates((prev) => ({
            ...prev,
            [resource.id]: {
              status: 'failed',
              progress: 0,
              errorMessage: getErrorMessage(reason),
            },
          }));
        }
      };

      enqueue(task);
    },
    [processQueue, t],
  );

  const handleCancel = useCallback((resourceId: string) => {
    cancelRef.current.get(resourceId)?.();
  }, []);

  const handleOpenDownloaded = useCallback(
    async (resourceId: string, localUri: string) => {
      try {
        await openDownloadedResource(localUri);
      } catch {
        setResourceStates((prev) => ({
          ...prev,
          [resourceId]: {
            ...prev[resourceId],
            errorMessage: t('home.resources.openDownloadedFailed'),
          },
        }));
      }
    },
    [t],
  );

  const renderProgressBar = useCallback(
    (resourceId: string, state: ResourceDownloadUiState) => {
      if (state.progress >= 0) {
        return (
          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${state.progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {t('home.resources.downloadingDescription', {
                progress: state.progress,
              })}
            </Text>
          </View>
        );
      }

      const anim = getAnim(resourceId);
      startAnim(resourceId);

      const translateX = anim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [-80, 0, 80],
      });

      return (
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[styles.progressFillIndeterminate, { transform: [{ translateX }] }]}
            />
          </View>
          <Text style={styles.progressText}>{t('home.resources.downloadingIndeterminate')}</Text>
        </View>
      );
    },
    [t],
  );

  return {
    resourceStates,
    previewingResources,
    handlePreview,
    handleDownload,
    handleCancel,
    handleOpenDownloaded,
    renderProgressBar,
    isDownloading: Object.values(resourceStates).some((s) => s.status === 'downloading'),
  } as const;
}

const styles = StyleSheet.create({
  progressWrap: {
    gap: 8,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#dbeafe',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#2563eb',
  },
  progressFillIndeterminate: {
    width: 80,
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#2563eb',
  },
  progressText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#64748b',
  },
});
