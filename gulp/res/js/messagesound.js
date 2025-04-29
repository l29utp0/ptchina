/* globals setLocalStorage */
window.addEventListener('DOMContentLoaded', () => {

    let sound = localStorage.getItem('sound') === 'true';
    const soundSetting = document.getElementById('sound-setting');

    const toggleSound = () => {
        sound = !sound;
        setLocalStorage('sound', sound);
        console.log('toggling sound', sound);
    };

    if (soundSetting) {
        soundSetting.checked = sound;
        soundSetting.addEventListener('change', toggleSound, false);
    }

});
