import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

type BootStatusScreenProps = {
  errorMessage?: string;
  onRetry: () => void;
};

export function BootStatusScreen({ errorMessage, onRetry }: BootStatusScreenProps) {
  const { t } = useTranslation();
  const hasError = Boolean(errorMessage);
  const localizedErrorMessage =
    errorMessage && errorMessage.startsWith('app.') ? t(errorMessage) : errorMessage;

  return (
    <View style={styles.container}>
      <View style={styles.panel}>
        <Text style={styles.title}>
          {hasError ? t('boot.failed') : t('boot.preparing')}
        </Text>
        <Text style={styles.body}>
          {hasError ? localizedErrorMessage : t('boot.description')}
        </Text>
        {hasError ? (
          <Pressable onPress={onRetry} style={styles.button}>
            <Text style={styles.buttonLabel}>{t('common.retry')}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    padding: 24,
  },
  panel: {
    width: '100%',
    borderRadius: 24,
    backgroundColor: '#ffffff',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  body: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 24,
    color: '#475569',
  },
  button: {
    marginTop: 18,
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#111827',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});
