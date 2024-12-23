'use strict';

const fortunes = [
	'ｷﾀ━━━━━━(ﾟ∀ﾟ)━━━━━━ !!!!',
	'（　´_ゝ`）ﾌｰﾝ',
	'ヾ(⌐■_■)ノ♪',
	'Má sorte',
	'Boa sorte',
	'Tenta outra vez',
	'Mais ou menos',
	'Não vais ter nada e vais gostar',
	'Vais comer os insetos',
	'Verdadeiro',
	'Falso',
	'Talvez',
	'Volta',
	'Toma os comprimidos',
	'Vais conhecer um angolano',
];

const colors = [
	'#FF5733', // Vivid Red-Orange
	'#C70039', // Vivid Red
	'#FFC300', // Bright Yellow
	'#900C3F', // Dark Pink
	'#581845', // Dark Purple
	'#FF9F00', // Bright Orange
	'#008CBA', // Bright Blue
	'#8E44AD', // Bright Purple
	'#2ECC71', // Bright Green
	'#F39C12', // Bright Orange-Yellow
	'#3498DB', // Bright Sky Blue
	'#E74C3C', // Bright Tomato Red
	'#1ABC9C', // Bright Turquoise
	'#F1C40F', // Vivid Gold
];

module.exports = {

	fortunes,

	regex: /##sorte/mi,

	markdown: () => {
		const randomFortune = fortunes[Math.floor(Math.random()*fortunes.length)];
		const randomColor = colors[Math.floor(Math.random() * colors.length)];
		return `<span class='fortune' style='color: ${randomColor}; font-weight: bold;'>Sorte: ${randomFortune}</span>`;
	},

};