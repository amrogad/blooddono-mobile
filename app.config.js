module.exports = {
  expo: {
    name: 'BloodDono',
    slug: 'blooddono-mobile',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'blooddono',
    userInterfaceStyle: 'automatic',
    android: {
      package: 'com.amrogad.blooddonomobile',
      adaptiveIcon: {
        backgroundColor: '#FFFFFF',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          backgroundColor: '#8B0000',
          android: {
            image: './assets/images/splash-icon.png',
            imageWidth: 96,
            resizeMode: 'contain',
          },
        },
      ],
      '@react-native-community/datetimepicker',
      'expo-font',
      [
        'expo-image-picker',
        {
          photosPermission: 'Allow BloodDono to access your photos to set a profile picture.',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: 'd2669be4-60a6-4552-8c68-a66cebf3a46f',
      },
    },
    owner: 'amrogad',
  },
};
