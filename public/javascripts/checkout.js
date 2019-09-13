//const stripe = require("stripe")("sk_test_jaaxtB6dn9mDaOBPAKb43a1A00AWzUss22");
var stripe = Stripe('pk_test_qBzpZk519CzUNHEcMAyADAbj00qJE3YDTZ');
//Stripe.setPublishableKey('pk_test_qBzpZk519CzUNHEcMAyADAbj00qJE3YDTZ');

var $form = $('#checkout-form');

// $form.submit(function (event) {
//     $('#charge-error').addClass('d-none');
//     $form.find('button').prop('disabled', true);
//     Stripe.card.createToken({
//         number: $('#card-number').val(),
//         cvc: $('#card-cvc').val(),
//         exp_month: $('#card-expiry-month').val(),
//         exp_year: $('#card-expiry-year').val(),
//         name: $('#card-name').val()
//     }, stripeResponseHandler);
//     return false;
// });

// stripe.skus.list(
//     {limit: 3},
//     function(err, skus) {
//       // asynchronously called
//       console.log(skus);
//     }
//   );

// var checkoutButton = document.querySelector('#checkout-button');
// checkoutButton.addEventListener('click', function () {
//   stripe.redirectToCheckout({
//     items: [{
//       // Define the product and SKU in the Dashboard first, and use the SKU
//       // ID in your client-side code.
//       sku: sku,
//       quantity: 1
//     }],
//     successUrl: 'https://www.example.com/success',
//     cancelUrl: 'https://www.example.com/cancel'
//   });
// });

function stripeResponseHandler(status, response) {
    if (response.error) { // Problem!

        // Show the errors on the form
        $('#charge-error').text(response.error.message);
        $('#charge-error').removeClass('d-none');
        $form.find('button').prop('disabled', false); // Re-enable submission

    } else { // Token was created!

        // Get the token ID:
        var token = response.id;

        // Insert the token into the form so it gets submitted to the server:
        $form.append($('<input type="hidden" name="stripeToken" />').val(token));

        // Submit the form:
        $form.get(0).submit();

    }
}
