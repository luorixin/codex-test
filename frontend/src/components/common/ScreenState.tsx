import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

type ScreenStateProps = {
  title: string;
  description?: string;
  tone?: 'default' | 'error';
  loading?: boolean;
  fullScreen?: boolean;
};

export function ScreenState({
  title,
  description,
  tone = 'default',
  loading = false,
  fullScreen = false,
}: ScreenStateProps) {
  return (
    <View style={[styles.container, fullScreen ? styles.fullScreen : null]}>
      {loading ? <ActivityIndicator color="#2563eb" /> : null}
      <Text style={[styles.title, tone === 'error' ? styles.errorTitle : null]}>{title}</Text>
      {description ? (
        <Text style={[styles.description, tone === 'error' ? styles.errorDescription : null]}>
          {description}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 24,
    backgroundColor: '#f3f4f6',
  },
  fullScreen: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  errorTitle: {
    color: '#991b1b',
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: '#64748b',
    textAlign: 'center',
  },
  errorDescription: {
    color: '#b91c1c',
  },
});
