import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Easing,
} from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Feather } from '@expo/vector-icons';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MentalHealthPresentation'>;
};

// Tiempos estimados (en ms) para cada bloque de texto
const SUBTITLES = [
  { time: 0, text: "Hola, soy NOMI." },
  { time: 1800, text: "Te ayudaré con la experiencia de esta demostración." },
  { time: 5000, text: "Esta experiencia permite conocer" },
  { time: 7000, text: "cómo NOMI Learning Care ayuda a una comunidad educativa" },
  { time: 10000, text: "a comprender y ordenar sus necesidades de salud mental." },
  { time: 13500, text: "A través de una conversación breve," },
  { time: 15500, text: "el sistema identifica señales asociadas" },
  { time: 17500, text: "al ánimo, la ansiedad y la sobrecarga," },
  { time: 20000, text: "incorpora el contexto expresado por cada persona" },
  { time: 23000, text: "y traduce esa información en una de cuatro rutas de cuidado:" },
  { time: 27000, text: "promoción, prevención, intervención o riesgo." }
];

export default function MentalHealthPresentationScreen({ navigation }: Props) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [subtitleIndex, setSubtitleIndex] = useState(0);
  const subtitleIndexRef = useRef(0);
  
  const textOpacity = useRef(new Animated.Value(0)).current;

  // Waveform anims
  const anim1 = useRef(new Animated.Value(8)).current;
  const anim2 = useRef(new Animated.Value(8)).current;
  const anim3 = useRef(new Animated.Value(8)).current;
  const anim4 = useRef(new Animated.Value(8)).current;
  const anim5 = useRef(new Animated.Value(8)).current;
  
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    // Fade in inicial
    Animated.timing(textOpacity, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Iniciar Animación de frecuencia
    const startAnim = (anim: Animated.Value, max: number, duration: number) => {
      return Animated.sequence([
        Animated.timing(anim, { toValue: max, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(anim, { toValue: 8, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ]);
    };

    pulseLoopRef.current = Animated.loop(
      Animated.parallel([
        startAnim(anim1, 24, 400),
        startAnim(anim2, 40, 300),
        startAnim(anim3, 56, 500),
        startAnim(anim4, 40, 350),
        startAnim(anim5, 24, 450),
      ])
    );
    pulseLoopRef.current.start();

    async function initAudio() {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/vo/nomi01.mp3'),
          { shouldPlay: true },
          (status: AVPlaybackStatus) => {
            if (status.isLoaded) {
              const pos = status.positionMillis;
              
              const nextIndex = SUBTITLES.findIndex(sub => sub.time > pos);
              let activeIndex = nextIndex === -1 ? SUBTITLES.length - 1 : nextIndex - 1;
              if (activeIndex < 0) activeIndex = 0;
              
              if (activeIndex !== subtitleIndexRef.current) {
                subtitleIndexRef.current = activeIndex;
                
                // Transición suave del texto
                Animated.timing(textOpacity, {
                  toValue: 0,
                  duration: 400,
                  useNativeDriver: true,
                }).start(() => {
                  setSubtitleIndex(activeIndex);
                  Animated.timing(textOpacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                  }).start();
                });
              }
            }
          }
        );
        soundRef.current = sound;
      } catch (err) {
        console.warn('Error playing audio', err);
      }
    }
    
    initAudio();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
      if (pulseLoopRef.current) {
        pulseLoopRef.current.stop();
      }
    };
  }, []);

  function handleStart() {
    if (soundRef.current) {
      soundRef.current.unloadAsync();
    }
    navigation.navigate('MentalHealthTarget');
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Feather name="arrow-left" size={24} color="#000" />
      </TouchableOpacity>

      <View style={styles.content}>
        
        <View style={styles.centerStage}>
          {/* Waveform animado central */}
          <View style={styles.waveformContainer}>
            <Animated.View style={[styles.waveBar, { height: anim1 }]} />
            <Animated.View style={[styles.waveBar, { height: anim2 }]} />
            <Animated.View style={[styles.waveBar, { height: anim3 }]} />
            <Animated.View style={[styles.waveBar, { height: anim4 }]} />
            <Animated.View style={[styles.waveBar, { height: anim5 }]} />
          </View>

          {/* Texto dinámico */}
          <Animated.Text style={[styles.subtitleText, { opacity: textOpacity }]}>
            {SUBTITLES[subtitleIndex].text}
          </Animated.Text>
        </View>

      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleStart} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Comenzar experiencia</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  centerStage: {
    alignItems: 'center',
    maxWidth: 600,
    width: '100%',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 80,
    marginBottom: 40,
  },
  waveBar: {
    width: 8,
    backgroundColor: '#000',
    borderRadius: 4,
  },
  subtitleText: {
    fontSize: 24,
    lineHeight: 36,
    fontWeight: '600',
    color: '#111',
    textAlign: 'center',
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  button: {
    backgroundColor: '#000',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
