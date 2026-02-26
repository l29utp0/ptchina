(function() {
	'use strict';

	function setupLogoToggle() {
		const navbar = document.querySelector('.navbar');
		if (!navbar) { return; }

		if (!navbar.hasClickHandler) {
			navbar.addEventListener('click', function(e) {
                // Check if click is near the logo area (top of navbar)
				if (e.clientY < 120 && window.innerWidth >= 600) {
					navbar.classList.remove('no-animate');
					navbar.classList.remove('expanded');
					navbar.classList.add('collapsed');
					const main = document.querySelector('main');
					if (main) {
						main.classList.remove('no-animate');
						main.classList.add('navbar-collapsed');
					}
					document.querySelector('#navbar-restore').classList.add('show');
					localStorage.setItem('navbar-collapsed', true);
				}
			});
			navbar.hasClickHandler = true;
		}
	}

	function addRestoreButton() {
		if (document.querySelector('#navbar-restore')) { return; }

		const restoreBtn = document.createElement('button');
		restoreBtn.id = 'navbar-restore';
		restoreBtn.textContent = '☰';
		document.body.appendChild(restoreBtn);

		restoreBtn.addEventListener('click', function() {
			const navbar = document.querySelector('.navbar');
			navbar.classList.remove('no-animate');
			navbar.classList.remove('collapsed');
			navbar.classList.add('expanded');
			const main = document.querySelector('main');
			if (main) {
				main.classList.remove('no-animate');
				main.classList.remove('navbar-collapsed');
			}
			restoreBtn.classList.remove('show');
			localStorage.setItem('navbar-collapsed', false);
		});

        // Restore previous state (only on desktop)
		if (window.innerWidth >= 600 && localStorage.getItem('navbar-collapsed') === 'true') {
			const navbar = document.querySelector('.navbar');
			const main = document.querySelector('main');
			if (navbar) {
				navbar.classList.add('no-animate');
				navbar.classList.add('collapsed');
			}
			if (main) {
				main.classList.add('no-animate');
				main.classList.add('navbar-collapsed');
			}
			restoreBtn.classList.add('show');

            // Remove no-animate class after initial layout to enable animations for user interactions
			setTimeout(() => {
				if (navbar) { navbar.classList.remove('no-animate'); }
				if (main) { main.classList.remove('no-animate'); }
			}, 50);
		}
	}

    // Try multiple ways to ensure setup is done
	if (document.body) {
		setupLogoToggle();
		addRestoreButton();
	}
	document.addEventListener('DOMContentLoaded', function() {
		setupLogoToggle();
		addRestoreButton();
	});
	setTimeout(function() {
		setupLogoToggle();
		addRestoreButton();
	}, 100);
})();
