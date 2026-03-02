const navbar = document.querySelector('.navbar');
const main = document.querySelector('main');

const restoreBtn = document.createElement('button');
restoreBtn.id = 'navbar-restore';
restoreBtn.textContent = '☰';
document.body.appendChild(restoreBtn);

if (window.innerWidth >= 600 && localStorage.getItem('navbar-collapsed') === 'true') {
	navbar.classList.add('no-animate', 'collapsed');
	if (main) { main.classList.add('no-animate', 'navbar-collapsed'); }
	restoreBtn.classList.add('show');
	setTimeout(() => {
		navbar.classList.remove('no-animate');
		if (main) { main.classList.remove('no-animate'); }
	}, 50);
}

navbar.addEventListener('click', function(e) {
	if (e.clientY < 120 && window.innerWidth >= 600) {
		navbar.classList.add('collapsed');
		navbar.classList.remove('expanded');
		if (main) { main.classList.add('navbar-collapsed'); }
		restoreBtn.classList.add('show');
		localStorage.setItem('navbar-collapsed', 'true');
	}
});

restoreBtn.addEventListener('click', function() {
	navbar.classList.remove('collapsed');
	navbar.classList.add('expanded');
	if (main) { main.classList.remove('navbar-collapsed'); }
	restoreBtn.classList.remove('show');
	localStorage.setItem('navbar-collapsed', 'false');
});
