/* eslint-disable */
import { loadStripe } from '@stripe/stripe-js';
import axios from 'axios';
import { showAlert } from './alerts';

export const bookTour = async (tourId) => {
  try {
    const stripe = async () =>
      await loadStripe(
        'pk_test_51NWht6CyqswTmJ2MHvls8qDz3AkYfYjeHRpCKOVyfhgJePn6Zy3PVTIiahuMKU1eJWv0fACigqHULk1YWNRG9WjX00nQLg2nsO'
      );

    // 1) Get checkout session from API
    const session = await axios(
      `https://serene-temple-63705-9f88ad6f27e0.herokuapp.com/api/v1/bookings/checkout-session/${tourId}`
    );

    // 2) Create checkout form + charge credit card
    location.assign(session.data.session.url);
  } catch (err) {
    showAlert('error', err);
  }
};
