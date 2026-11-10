import React, { useState } from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const ADMIN_PASSWORD = '123456';

export default function AdminPasswordModal({ visible, onCancel, onConfirm }) {
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitPassword = async () => {
    if (password !== ADMIN_PASSWORD) {
      Alert.alert('Senha incorreta', 'Verifique a senha do administrador.');
      return;
    }

    setIsSubmitting(true);
    try {
      const cleared = await onConfirm();
      if (cleared) {
        setPassword('');
        onCancel();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancel = () => {
    setPassword('');
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={cancel}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>Limpar Histórico</Text>
          <Text style={styles.message}>
            Digite a Senha do Administrador para apagar todas as coletas deste
            dispositivo.
          </Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Senha do Administrador"
            placeholderTextColor="#718078"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isSubmitting}
            returnKeyType="done"
            onSubmitEditing={submitPassword}
            accessibilityLabel="Senha do Administrador"
          />
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={cancel}
              disabled={isSubmitting}
              accessibilityRole="button"
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                isSubmitting && styles.disabledButton,
              ]}
              onPress={submitPassword}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityState={{ disabled: isSubmitting }}
            >
              <Text style={styles.confirmButtonText}>
                {isSubmitting ? 'Limpando...' : 'Confirmar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  dialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 22,
    gap: 14,
  },
  title: {
    color: '#142D25',
    fontSize: 22,
    fontWeight: '700',
  },
  message: {
    color: '#40564D',
    fontSize: 16,
    lineHeight: 23,
  },
  input: {
    minHeight: 52,
    backgroundColor: '#F8FAF9',
    borderWidth: 1,
    borderColor: '#B9C9C0',
    borderRadius: 10,
    color: '#142D25',
    fontSize: 16,
    paddingHorizontal: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  button: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 16,
  },
  cancelButton: {
    backgroundColor: '#EDF2EF',
  },
  cancelButtonText: {
    color: '#263D34',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#B42318',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.65,
  },
});
