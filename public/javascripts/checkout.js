//const stripe = require("stripe")("sk_test_jaaxtB6dn9mDaOBPAKb43a1A00AWzUss22");
//Stripe.setPublishableKey('pk_test_qBzpZk519CzUNHEcMAyADAbj00qJE3YDTZ');
var $form = $('#checkout-form');
var stripe = Stripe('pk_test_qBzpZk519CzUNHEcMAyADAbj00qJE3YDTZ');
var elements = stripe.elements();

var card = elements.create('card', {
  style: {
    base: {
      iconColor: '#666EE8',
      color: '#31325F',
      lineHeight: '40px',
      fontWeight: 300,
      fontFamily: 'Helvetica Neue',
      fontSize: '15px',

      '::placeholder': {
        color: '#CFD7E0',
      },
    },
  }
});
card.mount('#card-element');

function setOutcome(result) {
  var successElement = document.querySelector('.success');
  var errorElement = document.querySelector('.error');
  successElement.classList.remove('visible');
  errorElement.classList.remove('visible');

  if (result.token) {
    // Use the token to create a charge or a customer
    // https://stripe.com/docs/charges
    successElement.querySelector('.token').textContent = result.token.id;
    //successElement.classList.add('visible');
    //submit the form
    //console.log("token ID: " + result.token.id);
    stripeTokenHandler(result.token.id);
  } else if (result.error) {

    errorElement.textContent = result.error.message;
    errorElement.classList.add('visible');
  }
}

card.on('change', function(event) {
  setOutcome(event);
});

document.querySelector('form').addEventListener('submit', function(e) {
  e.preventDefault();
  var form = document.querySelector('form');
  var extraDetails = {
    name: form.querySelector('input[name=cardholder-name]').value,
  };
  stripe.createToken(card, extraDetails).then(setOutcome);
});

const stripeTokenHandler = (token) => {
    // Insert the token ID into the form so it gets submitted to the server
    const form = document.getElementById('payment-form');
    const hiddenInput = document.createElement('input');
    hiddenInput.setAttribute('type', 'text');
    hiddenInput.setAttribute('name', 'stripeToken');
    hiddenInput.setAttribute('value', token);
    form.appendChild(hiddenInput);
  
    // Submit the form
    form.submit();
  }

  // DEPRECATED V1
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
