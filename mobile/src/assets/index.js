/**
 * LaundryFlow Visual Assets
 * High-definition isometric illustrations matching dark navy & deep purple theme.
 * Dual-compatible with React Native Metro and Vite Web bundlers.
 */
import washingMachine from './illustrations/washing_machine.jpg';
import laundryWashing from './illustrations/laundry_washing.jpg';
import foldedClothes from './illustrations/folded_clothes.jpg';
import pickupDelivery from './illustrations/pickup_delivery.jpg';
import orderTracking from './illustrations/order_tracking.jpg';
import emptyOrders from './illustrations/empty_orders.jpg';
import orderSuccess from './illustrations/order_success.jpg';

import logo from './logo.png';

// Real Clothes Photography Assets
import shirtImg from './clothes/shirt.jpg';
import suitImg from './clothes/suit.jpg';
import sareeImg from './clothes/saree.jpg';
import jeansImg from './clothes/jeans.jpg';
import tshirtImg from './clothes/tshirt.jpg';
import bedsheetImg from './clothes/bedsheet.jpg';
import shoesImg from './clothes/shoes.jpg';

export const illustrations = {
  washingMachine,
  laundryWashing,
  foldedClothes,
  pickupDelivery,
  orderTracking,
  emptyOrders,
  orderSuccess,
};

export const clothes = {
  shirt: shirtImg,
  suit: suitImg,
  blazer: suitImg,
  coat: suitImg,
  saree: sareeImg,
  dress: sareeImg,
  kurta: sareeImg,
  sherwani: suitImg,
  jeans: jeansImg,
  trouser: jeansImg,
  tshirt: tshirtImg,
  bedsheet: bedsheetImg,
  blanket: bedsheetImg,
  shoes: shoesImg,
  other: shirtImg,
};

export const ASSETS = {
  illustrations,
  clothes,
  logo,
};

export default ASSETS;
