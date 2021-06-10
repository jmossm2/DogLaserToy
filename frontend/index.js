
(() => {
    // Button class
    function Button(elem, options = {}) {
        this.elem = elem;
        this.pressedPath = options.pressed;
        this.releasedPath = options.released;
        this.debug = options.debug == true;
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

        if (this.debug) {
            console.log(`[ID: '${this.elem.id}']: Pressed${this.pressedPath ? ` (POST '${this.pressedPath}')` : ''}`);
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

        if (this.debug) {
            console.log(`[ID: '${this.elem.id}']: Released${this.releasedPath ? ` (POST '${this.releasedPath}')` : ''}`);
        }
    }

    function Joystick(elem, options = {}) {
        this.elem = elem;
        this.mode = options.mode || 'velocity';
        this.sendPath = options.sendTo;
        this.sendInt = (options.sendInterval > 50) ? options.sendInterval : 50;
        this.debug = options.debug == true;
        this.enabled = false;
        this.initialized = false;
        this.prevX = 0; // prev values used to indicate the set of xy that is processed and sent to server
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
        this.elem.addEventListener('touchmove', this._handleMove.bind(this));
        this.elem.addEventListener('touchend', this._handleRelease.bind(this));

        this.initialized = true;

        this._stateCheckLoop();

        this.enable();
    }
    Joystick.prototype.disconnect = function () {
        if (this.initialized) {
            this.elem.removeEventListener('touchstart', this._handleTouch.bind(this));
            this.elem.removeEventListener('touchmove', this._handleMove.bind(this));
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
    Joystick.prototype._handleMove = function (e) {
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
        if (this.prevX != this.currX && this.prevY != this.currY) {
            let now = Date.now();
            if (now > this._lastDispatch + this.sendInt) {
                this._lastDispatch = now;
                let pCoords = this._processPositionData();
                let uri;
                if (this.sendPath) {
                    uri = `${this.sendPath}?mode=${this.mode}&x=${pCoords.x}&y=${pCoords.y}`;
                    fetch(uri, {
                        method: 'POST'
                    });
                }

                if (this.debug) {
                    if (uri) {
                        console.log(`[ID: '${this.elem.id}']: StickChange (POST '${uri}')`);
                    }
                    else {
                        console.log(`[ID: '${this.elem.id}']: StickChange (x: ${pCoords.x}, y: ${pCoords.y})`);
                    }
                }
            }
        }
    }
    Joystick.prototype._stateCheckLoop = function () {
        if (this.prevX != this.currX && this.prevY != this.currY) {
            this._lastDispatch = Date.now();
            let pCoords = this._processPositionData();
            let uri;
            if (this.sendPath) {
                uri = `${this.sendPath}?mode=${this.mode}&x=${pCoords.x}&y=${pCoords.y}`;
                fetch(uri, {
                    method: 'POST'
                });
            }

            if (this.debug) {
                if (uri) {
                    console.log(`[ID: '${this.elem.id}']: StickChange (POST '${uri}')`);
                }
                else {
                    console.log(`[ID: '${this.elem.id}']: StickChange (x: ${pCoords.x}, y: ${pCoords.y})`);
                }
            }
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
            pressed: '/laser?mode=on',
            released: '/laser?mode=off',
            debug: true
        });
        b.init();

        let joystick = document.createElement('div');
        joystick.setAttribute('class', 'joystick');
        joystick.appendChild(document.createElement('div'));
        view.appendChild(joystick);
        let j = new Joystick(joystick, {
            mode: 'velocity',
            sendTo: '/servo',
            debug: true
        });
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

})();