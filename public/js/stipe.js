/*eslint-disable */
import axios from 'axios';
import { showAlert } from './alert';
const stripe = Stripe(
  'pk_test_51KJZfmDjZEIeKHzg3EwJrQlcGq82z2Qb24lPcbmRDH6nmAIzcYFACl5YHNuotwwJmjcwcqThI3HG7RfNY19ZYjll00F7drNekd'
);

export const bookTour = async tourId => {
  try {
    // 1) get checkout session from api
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    // console.log(session);

    // 2) create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (err) {
    showAlert('error', err.msg);
  }
};
