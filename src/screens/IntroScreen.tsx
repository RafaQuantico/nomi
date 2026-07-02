import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Text,
  Platform,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Intro'>;
};

export default function IntroScreen({ navigation }: Props) {
  const nomiOpacity = useRef(new Animated.Value(0)).current;
  const quanticoOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(nomiOpacity, {
      toValue: 1, duration: 1000, useNativeDriver: true,
    }).start();

    setTimeout(() => {
      Animated.timing(quanticoOpacity, {
        toValue: 1, duration: 500, useNativeDriver: true,
      }).start();
    }, 1000);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(nomiOpacity, {
          toValue: 0, duration: 500, useNativeDriver: true,
        }),
        Animated.timing(buttonOpacity, {
          toValue: 1, duration: 500, useNativeDriver: true,
        }),
      ]).start();
    }, 3000);
  }, []);

  return (
    <View style={styles.container}>
      <Video
        source={require('../../assets/bgn01.mp4')}
        style={[
          StyleSheet.absoluteFill,
          { width: '100%', height: '100%' },
          Platform.OS === 'web' && { transform: [{ rotate: '90deg' }, { scale: 1.8 }] }
        ]}
        resizeMode={ResizeMode.COVER}
        isLooping
        shouldPlay
        isMuted={true}
      />
      <View style={styles.centerContainer}>
        <Animated.Image
          source={require('../../assets/Nomi_Negro.png')}
          style={[styles.nomiLogo, { opacity: nomiOpacity }]}
          resizeMode="contain"
        />
        <Animated.View style={[styles.buttonContainer, { opacity: buttonOpacity }]}>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Auth')}>
            <Text style={styles.buttonText}>Comenzar</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <Animated.Image
        source={require('../../assets/logo_hor.png')}
        style={[styles.quanticoLogo, { opacity: quanticoOpacity }]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 200,
  },
  nomiLogo: {
    width: 250,
    height: 100,
    position: 'absolute',
  },
  buttonContainer: {
    position: 'absolute',
  },
  button: {
    backgroundColor: '#000',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#333',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  quanticoLogo: {
    position: 'absolute',
    bottom: 50,
    width: 120,
    height: 40,
  },
});
