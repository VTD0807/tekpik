import PhoneIcon from './PhoneIcon';
import LaptopIcon from './LaptopIcon';
import HeadphonesIcon from './HeadphonesIcon';
import TabletIcon from './TabletIcon';
import WatchIcon from './WatchIcon';
import DroneIcon from './DroneIcon';
import CameraIcon from './CameraIcon';
import GamingIcon from './GamingIcon';

export function getIconForCategory(category) {
  const iconMap = {
    'Smartphones': <PhoneIcon />,
    'Laptops': <LaptopIcon />,
    'Audio': <HeadphonesIcon />,
    'Tablets': <TabletIcon />,
    'Smartwatches': <WatchIcon />,
    'Drones': <DroneIcon />,
    'Cameras': <CameraIcon />,
    'Gaming': <GamingIcon />,
  };
  
  return iconMap[category] || <PhoneIcon />;
}
