
(() => {
    // Button class
    function Button(elem, options = {}) {
        this.elem = elem;
        this.pressedPath = options.pressed;
        this.releasedPath = options.released;
        this.enabled = false;
        this.initialized = false;
    }
    Button.prototype.enable = function () {
        if (!this.initialized) return;
        this.enabled = true;
        this.elem.classList.remove('disabled');
    }
    Button.prototype.disable = function () {
        this.enabled = false;
        this.elem.classList.add('disabled');
    }
    Button.prototype.init = function () {
        if (this.initialized) return;
        this.elem.addEventListener('touchstart', this._handlePress.bind(this));
        this.elem.addEventListener('mousedown', this._handlePress.bind(this));
        this.elem.addEventListener('touchend', this._handleRelease.bind(this));
        this.elem.addEventListener('mouseup', this._handleRelease.bind(this));

        this.initialized = true;

        this.enable();
    }
    Button.prototype.disconnect = function () {
        if (this.initialized) {
            this.elem.removeEventListener('touchstart', this._handlePress.bind(this));
            this.elem.removeEventListener('mousedown', this._handlePress.bind(this));
            this.elem.removeEventListener('touchend', this._handleRelease.bind(this));
            this.elem.removeEventListener('mouseup', this._handleRelease.bind(this));
        }

        this.initialized = false;

        this.disable();
    }
    Button.prototype._handlePress = function (e) {
        e.preventDefault();
        if (!this.enabled) return;
        this.elem.classList.add('pressed');

        if (this.pressedPath) {
            fetch(this.pressedPath, {
                method: 'POST'
            });
        }
    }
    Button.prototype._handleRelease = function (e) {
        e.preventDefault();
        if (!this.enabled) return;
        this.elem.classList.remove('pressed');

        if (this.releasedPath) {
            fetch(this.releasedPath, {
                method: 'POST'
            });
        }
    }

    function Joystick(elem, options = {}) {
        this.elem = elem;
        this.mode = options.mode;
        this.sendPath = options.sendTo;
        this.sendInt = (options.sendInterval > 50) ? options.sendInterval : 50;
        this.enabled = false;
        this.initialized = false;
        this.prevX = 0; // previously processed value
        this.prevY = 0;
        this.currX = 0;
        this.currY = 0;
        this._lastDispatch = 0;
    }
    Joystick.prototype.enable = function () {
        if (!this.initialized) return;
        this.enabled = true;
        this.elem.classList.remove('disabled');
    }
    Joystick.prototype.disable = function () {
        this.enabled = false;
        this.elem.classList.add('disabled');
    }
    Joystick.prototype.init = function () {
        if (this.initialized) return;
        this.elem.addEventListener('touchstart', this._handleTouch.bind(this));
        this.elem.addEventListener('touchmove', this._handleTouchMove.bind(this));
        this.elem.addEventListener('touchend', this._handleRelease.bind(this));

        this.initialized = true;

        this._stateCheckLoop();

        this.enable();
    }
    Joystick.prototype.disconnect = function () {
        if (this.initialized) {
            this.elem.removeEventListener('touchstart', this._handleTouch.bind(this));
            this.elem.removeEventListener('touchmove', this._handleTouchMove.bind(this));
            this.elem.removeEventListener('touchend', this._handleRelease.bind(this));
        }

        this.initialized = false;

        this.disable();
    }
    Joystick.prototype._handleTouch = function (e) {
        e.preventDefault();
        if (!this.enabled) return;

        let touch = e.touches[0] || e.changedTouches[0];
        this._updatePositionData(touch.pageX - this.elem.offsetLeft - this.elem.offsetWidth / 2, touch.pageY - this.elem.offsetTop - this.elem.offsetWidth / 2);
        this.elem.classList.remove('released');
        this._repositionStick();
        this._dispatchState();
    }
    Joystick.prototype._handleTouchMove = function (e) {
        e.preventDefault();
        if (!this.enabled) return;

        let touch = e.touches[0] || e.changedTouches[0];
        this._updatePositionData(touch.pageX - this.elem.offsetLeft - this.elem.offsetWidth / 2, touch.pageY - this.elem.offsetTop - this.elem.offsetWidth / 2);
        this._repositionStick();
    }
    Joystick.prototype._handleRelease = function (e) {
        e.preventDefault();
        if (!this.enabled) return;

        this._updatePositionData(0, 0);
        this.elem.classList.add('released');
        this._repositionStick();
        this._dispatchState();
    }
    Joystick.prototype._updatePositionData = function (x = 0, y = 0) {
        if (x != this.currX) {
            this.currX = x;
        }
        if (y != this.currY) {
            this.currY = y;
        }
    }
    Joystick.prototype._repositionStick = function () {
        let stick = this.elem.children[0];
        if (!stick) return;
        let rad = Math.atan2(this.currY, this.currX);
        let mag = Math.hypot(this.currX, this.currY);
        if (mag > this.elem.offsetWidth / 2) {
            stick.style.left = (this.elem.offsetWidth * (Math.cos(rad) + 1) - stick.offsetWidth) / 2 + 'px';
            stick.style.top = (this.elem.offsetWidth * (Math.sin(rad) + 1) - stick.offsetHeight) / 2 + 'px';
        }
        else {
            stick.style.left = (this.currX + (this.elem.offsetWidth - stick.offsetWidth) / 2) + 'px';
            stick.style.top = (this.currY + (this.elem.offsetWidth - stick.offsetHeight) / 2) + 'px';
        }
    }
    Joystick.prototype._processPositionData = function () {
        this.prevX = this.currX;
        this.prevY = this.currY;
        let px, py, rad, mag;
        rad = Math.atan2(this.currY, this.currX);
        mag = Math.hypot(this.currX, this.currY);
        if (mag > this.elem.offsetWidth / 2) {
            px = Math.round(this.currX / mag * 100);
            py = Math.round(this.currY / mag * 100);
        }
        else {
            px = Math.round(this.currX * 2 / this.elem.offsetWidth * 100);
            py = Math.round(this.currY * 2 / this.elem.offsetWidth * 100);
        }
        return { x: px, y: py };
    }
    Joystick.prototype._dispatchState = function () {
        if (!this.sendPath) return;
        if (this.prevX != this.currX && this.prevY != this.currY) {
            let now = Date.now();
            if (now > this._lastDispatch + this.sendInt) {
                this._lastDispatch = now;
                let pCoords = this._processPositionData();
                fetch(`${this.sendPath}?mode=${this.mode}&x=${pCoords.x}&y=${pCoords.y}`, {
                    method: 'POST'
                });
            }
        }
    }
    Joystick.prototype._stateCheckLoop = function () {
        if (!this.sendPath) return;
        if (this.prevX != this.currX && this.prevY != this.currY) {
            this._lastDispatch = Date.now();
            let pCoords = this._processPositionData();
            fetch(`${this.sendPath}?mode=${this.mode}&x=${pCoords.x}&y=${pCoords.y}`, {
                method: 'POST'
            });
        }

        setTimeout(this._stateCheckLoop.bind(this), this.sendInt);
    }


    let host = document.location.origin;
    let stream_url = host + ':81';

    let view;
    let viewSelector;
    let stream;

    function loadMobileView() {
        view.classList.add('mobile');
        let streamContainer = document.createElement('div');
        streamContainer.setAttribute('class', 'stream-container');
        stream = document.createElement('img');
        stream.setAttribute('id', 'stream');
        streamContainer.appendChild(stream);
        view.appendChild(streamContainer);

        let laserSwitch = document.createElement('div');
        laserSwitch.setAttribute('class', 'laser-switch');
        view.appendChild(laserSwitch);
        let b = new Button(laserSwitch, {
            // pressed: '/laser?mode=on',
            // released: '/laser?mode=off'
        });
        b.init();
        // b.disconnect();

        // laserSwitch.addEventListener('touchstart', turnOnLaser);
        // laserSwitch.addEventListener('touchend', turnOffLaser);
        laserSwitch.addEventListener('touchmove', (e) => {
            console.log(e);
            e.preventDefault();
            let x, y;
            var touch = e.touches[0] || e.changedTouches[0];
            x = touch.pageX - e.target.offsetLeft - e.target.offsetWidth / 2;
            y = touch.pageY - e.target.offsetTop - e.target.offsetWidth / 2;
            console.log('x: ' + x + ', y: ' + y);
        });

        let joystick = document.createElement('div');
        joystick.setAttribute('class', 'joystick');
        joystick.appendChild(document.createElement('div'));
        view.appendChild(joystick);
        let j = new Joystick(joystick);
        j.init();

        startStream();

        viewSelector.classList.add('hidden');
    }

    function loadDesktopView() {
        view.classList.add('desktop');

        viewSelector.classList.add('hidden');
    }

    function startStream() {
        if (!stream) return;
        stream.src = `${stream_url}/stream`;
    }
    function stopStream() {
        window.stop();
    }

    function turnOnLaser(e) {
        e.preventDefault();
        e.target.classList.add('pressed');

        fetch('/laser', {
            method: 'POST',
            body: 'on'
        });
    }

    function turnOffLaser(e) {
        e.preventDefault();
        e.target.classList.remove('pressed');
        fetch('/laser', {
            method: 'POST',
            body: 'off'
        });
    }

    document.addEventListener('DOMContentLoaded', (e) => {
        view = document.getElementById('view');
        viewSelector = document.getElementById('view-selector');

        document.getElementById('mobile-selector').addEventListener('click', loadMobileView);
        document.getElementById('desktop-selector').addEventListener('click', loadDesktopView);
    });


    // document.addEventListener('DOMContentLoaded', (e) => {
    //     var baseHost = document.location.origin;
    //     // var streamUrl = baseHost + ':81'

    //     const view = document.getElementById('stream');
    //     const viewContainer = document.getElementById('stream-container');

    //     function startStream() {
    //         view.src = `${baseHost}/stream`;
    //     }
    //     function stopStream() {
    //         window.stop();
    //     }

    //     startStream();
    // });
})();