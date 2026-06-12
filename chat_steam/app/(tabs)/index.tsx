import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('@/assets/images/gaben.jpg')}
              style={styles.logoImage}
              resizeMode="cover"
            />
          </View>
          <Text style={styles.title}>Steamcito</Text>
          <Text style={styles.subtitle}>Tu Asistente Gamer Inteligente de Steam</Text>
        </View>

        {/* Features Container */}
        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>¿Qué puedo hacer por vos?</Text>
          
          <View style={[styles.card, styles.cardBlue]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>📝</Text>
              <Text style={[styles.cardTitle, styles.titleBlue]}>Reseñas y Opiniones</Text>
            </View>
            <Text style={styles.cardDescription}>
              Obtené una reseña rápida y el consenso de la comunidad sobre cualquier videojuego.
            </Text>
          </View>

          <View style={[styles.card, styles.cardYellow]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>⭐</Text>
              <Text style={[styles.cardTitle, styles.titleYellow]}>Puntuación y Jugadores</Text>
            </View>
            <Text style={styles.cardDescription}>
              Consultá las puntuaciones de usuarios y enterate cuánta gente está jugando en vivo.
            </Text>
          </View>

          <View style={[styles.card, styles.cardGreen]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>💵</Text>
              <Text style={[styles.cardTitle, styles.titleGreen]}>Precios en USD y ARS</Text>
            </View>
            <Text style={styles.cardDescription}>
              Mirá el precio oficial en dólares y un cálculo estimado en pesos argentinos con impuestos incluidos.
            </Text>
          </View>

          <View style={[styles.card, styles.cardPurple]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>💻</Text>
              <Text style={[styles.cardTitle, styles.titlePurple]}>Requisitos de Hardware</Text>
            </View>
            <Text style={styles.cardDescription}>
              Verificá al instante si tu PC cumple con los requisitos mínimos y recomendados.
            </Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => router.push('/chat')}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Iniciar Consulta</Text>
          <IconSymbol size={18} name="chevron.right" color="#fff" />
        </TouchableOpacity>

        {/* Footer */}
        <Text style={styles.footerText}>Desarrollado con ❤️ para la comunidad gamer</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1b2838', // Steam Classic Blue-Gray Dark
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
    paddingBottom: 32,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#171a21', // Steam Outer Space Black
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#66c0f4', // Steam Sky Blue
    shadowColor: '#66c0f4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  logoImage: {
    width: 94,
    height: 94,
    borderRadius: 47,
  },
  title: {
    fontSize: 30, // Responsive font size for narrow mobile screens
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14.5,
    color: '#66c0f4',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '600',
    paddingHorizontal: 10,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  card: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  cardBlue: {
    backgroundColor: 'rgba(26, 43, 60, 0.75)',
    borderColor: 'rgba(102, 192, 244, 0.25)',
  },
  cardYellow: {
    backgroundColor: 'rgba(41, 37, 24, 0.75)',
    borderColor: 'rgba(255, 209, 102, 0.25)',
  },
  cardGreen: {
    backgroundColor: 'rgba(28, 43, 30, 0.75)',
    borderColor: 'rgba(163, 207, 6, 0.25)',
  },
  cardPurple: {
    backgroundColor: 'rgba(37, 27, 56, 0.75)',
    borderColor: 'rgba(192, 132, 252, 0.25)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  cardIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 16.5,
    fontWeight: 'bold',
  },
  titleBlue: {
    color: '#66c0f4',
  },
  titleYellow: {
    color: '#ffd166',
  },
  titleGreen: {
    color: '#a3cf06',
  },
  titlePurple: {
    color: '#c084fc',
  },
  cardDescription: {
    fontSize: 13.5,
    color: '#c7d5e0', // Steam Text Light Gray
    lineHeight: 18,
  },
  button: {
    backgroundColor: '#107c10', // Steam Green / Gaming Green Accent
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 25,
    width: '100%',
    shadowColor: '#107c10',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 16,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16.5,
    fontWeight: 'bold',
    marginRight: 6,
  },
  footerText: {
    fontSize: 11.5,
    color: '#c7d5e0',
    opacity: 0.5,
    marginTop: 6,
  },
});
