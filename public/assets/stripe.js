//Stripe.setPublishableKey(publickey);
//var stripe=Stripe(publickey);
var StripeHandler=StripeCheckout.configure({
          key:publickey,
          locale:'auto',
          token:function(token){
            console.log('purchased');
          }
        })

function stripepop(){
        StripeHandler.open({
          price:12000

        })
      }