with open("src/screens/ServiceSelectionScreen.tsx", "r") as f:
    content = f.read()

import re

target = """    if (serviceId === 'fatigue') {
      // Enviar email de bienvenida + instrucciones via webhook
      if (user) {
        const deepLink = Platform.OS === 'web' ? `${window.location.origin}/test` : 'nomi-app://test';
        sendWelcomeEmail({
          email: user.email,
          nickname: user.nickname,
          deepLinkUrl: deepLink,
        });
      }
      navigation.navigate('EmailConfirmation');
    }"""

replacement = """    if (serviceId === 'fatigue') {
      navigation.navigate('FatigueMetadata');
    }"""

if target in content:
    content = content.replace(target, replacement)
    with open("src/screens/ServiceSelectionScreen.tsx", "w") as f:
        f.write(content)
    print("Patched successfully")
else:
    print("Target not found")
