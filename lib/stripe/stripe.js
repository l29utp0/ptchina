'use strict';

const { stripeSecretKey, stripeWebhookSecret, domain, currency, productName, productDescription, amount } = require(__dirname + '/../../configs/secrets.js');
const stripe = require('stripe')(stripeSecretKey);
const { Permissions } = require('../permission/permissions.js');
const Permission = require('../permission/permission.js');
const { Accounts } = require('../../db/');

// Export these functions directly
module.exports = {
	handleCheckoutRoute: async (req, res) => {
		try {
			const session = await stripe.checkout.sessions.create({
				line_items: [{
					price_data: {
						currency: `${currency}`,
						product_data: {
							name: `${productName}`,
							description: `${productDescription}`
						},
						unit_amount: `${amount}`,
					},
					quantity: 1,
				}],
				mode: 'payment',
				success_url: `${domain}`,
				cancel_url: `${domain}`,
				client_reference_id: res.locals.user.username,

				payment_intent_data: {
    				metadata: {
      					username: res.locals.user.username,
   					 }
 				 },
			});

			console.log('Stripe session created:', session.id, session.url);

            // Return JSON with the redirect URL and a flag to open in new tab
			return res.json({
				redirect: session.url
			});
		} catch (err) {
			console.error('Error creating Stripe session:', err);
			return res.status(500).json({ error: err.message });
		}
	},

	handleWebhookRoute: async (req, res) => {
        // Log the incoming webhook request for debugging
		console.log('Webhook received. Headers:', Object.keys(req.headers));
		console.log('Stripe-Signature:', req.headers['stripe-signature'] ? 'Present' : 'Missing');

		const sig = req.headers['stripe-signature'];

		if (!sig) {
			console.error('No Stripe signature found in webhook request');
			return res.status(400).send('No Stripe signature');
		}

		let event;

		try {
            // For Express raw middleware, req.body should be the Buffer
			const payload = req.body;

            // Construct the event using the raw body
			event = stripe.webhooks.constructEvent(
				payload,
				sig,
				stripeWebhookSecret
			);

			console.log('Webhook verified, event type:', event.type);
		} catch (err) {
			console.error('Webhook signature verification failed:', err);
			return res.status(400).send(`Webhook Error: ${err.message}`);
		}

		try {
            // Handle the event
			if (event.type === 'checkout.session.completed') {
				const session = event.data.object;
				console.log('Checkout completed for user:', session.client_reference_id);

				if (!session.client_reference_id) {
					console.error('No client_reference_id in session data');
					return res.status(400).send('Missing client_reference_id');
				}

				await updateUserPermissions(session.client_reference_id);
			} else {
				console.log(`Unhandled event type: ${event.type}`);
			}

            // Return a 200 response to acknowledge receipt of the event
			return res.json({ received: true });
		} catch (err) {
			console.error('Error handling webhook event:', err);
			return res.status(500).json({ error: err.message });
		}
	}
};

async function updateUserPermissions(username) {
	try {
		console.log(`Updating permissions for user: ${username}`);

        // Find the user account
		const account = await Accounts.findOne(username);

		if (!account) {
			console.error(`Account ${username} not found`);
			return;
		}

        // Create a permission object from existing permissions
		const permission = new Permission(account.permissions);

        // Add permissions
		permission.set(Permissions.DONOR, true);
		permission.set(Permissions.CREATE_BOARD, true);
		permission.set(Permissions.BYPASS_DNSBL, true);
		permission.set(Permissions.BYPASS_ANONYMIZER_RESTRICTIONS, true);
		permission.set(Permissions.BYPASS_CAPTCHA, true);
		permission.set(Permissions.USE_MARKDOWN_PINKTEXT, true);
		permission.set(Permissions.USE_MARKDOWN_TITLE, true);
		permission.set(Permissions.USE_MARKDOWN_DETECTED, true);
		permission.set(Permissions.USE_MARKDOWN_DICE, true);
		permission.set(Permissions.USE_MARKDOWN_FORTUNE, true);

        // Use the same pattern as editaccount.js
		const updated = await Accounts.setAccountPermissions(username, permission)
			.then(r => r.matchedCount);

		if (updated === 0) {
			console.error(`Failed to update permissions for user: ${username}`);
			return;
		}

		console.log(`Successfully added DONOR permissions to ${username}`);
	} catch (err) {
		console.error('Error updating user permissions:', err);
		throw err;
	}
}
