
import React from 'react';
import { SafeAreaView, StyleSheet, Text, Button, View } from 'react-native';

const MainScreen = ({ username, onLogout }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.text}>Welcome, {username}!</Text>
        <Button title="Logout" onPress={onLogout} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    marginBottom: 20,
  },
});

export default MainScreen;
