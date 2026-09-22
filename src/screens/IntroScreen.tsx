import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Text,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Intro'>;
};

export default function IntroScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const isDesktop = width > 768;

  const nomiOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(nomiOpacity, {
      toValue: 1, duration: 1000, useNativeDriver: true,
    }).start();

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
          isDesktop 
            ? {
                width: height,
                height: width,
                left: (width - height) / 2,
                top: (height - width) / 2,
                transform: [{ rotate: '90deg' }]
              }
            : { width: '100%', height: '100%' }
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
          <TouchableOpacity style={styles.buttonWrapper} onPress={() => navigation.navigate('Auth')} activeOpacity={0.8}>
            <LinearGradient colors={['#3B82F6', '#14B8A6']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={styles.buttonGradient}>
              <Text style={styles.buttonText}>Comenzar</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
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
  buttonWrapper: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: "Inter_800ExtraBold",
    textAlign: 'center',
  },
});
