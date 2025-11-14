import Alpine from 'alpinejs';
import '@phosphor-icons/webcomponents/PhCircleHalf';
import '@phosphor-icons/webcomponents/PhSun';
import '@phosphor-icons/webcomponents/PhMoon';

import { createIcons, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide';

createIcons({
  icons: {
    PanelLeftClose,
    PanelLeftOpen,
    PanelRightClose,
    PanelRightOpen
  }
});

window.Alpine = Alpine;

Alpine.start()

console.log('Alpine.js has been started');