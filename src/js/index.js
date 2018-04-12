(function () {
    'use strict';

    const doc = (document._currentScript || document.currentScript).ownerDocument;
    const widgetName = 'sfo-webcam';

    window.customElements.define(widgetName, class extends HTMLElement {

        notify(eventName, detail) {
            this.dispatchEvent(new CustomEvent(eventName, {
                bubbles: true,
                composed: true,
                detail: detail
            }));
        }

        constructor() {
            super();

            console.log('webcam: constructor');
        }

        plotRectangle(el, rect) {

            this.container.innerHTML = '';

            const div = document.createElement('div');
            div.style.position = 'absolute';
            div.style.border = '2px solid ' + (rect.color || 'magenta');
            div.style.width = rect.width + 'px';
            div.style.height = rect.height + 'px';
            div.style.left = el.offsetLeft + rect.x + 'px';
            div.style.top = el.offsetTop + rect.y + 'px';

            this.container.appendChild(div);
            return div;
        }

        connectedCallback() {

            console.log('webcam: connecting');

            Webcam.set({
                width: 320,
                height: 240,
                image_format: 'jpeg',
                jpeg_quality: 90
            });

            Webcam.attach(widgetName);

            Webcam.on('live', () => {

                this.trackFace();
            });
        }

        trackFace() {

            console.log('webcam: start tracking');

            const selector = widgetName + ' video';
            const element = document.querySelector(selector);

            if (element) {

                this.container = document.createElement('div');
                this.appendChild(this.container);

                const objects = new tracking.ObjectTracker(['face']);

                this.catchCounter = 0;

                objects.on('track', event => {
                    if (event.data.length === 0) {
                        console.log('webcam: no face');
                        this.container.innerHTML = '';
                    } else {
                        event.data.forEach(rect => {

                            console.log('webcam: found face !');

                            this.plotRectangle(element, rect);


                            this.catchCounter++;

                            if (this.catchCounter === 5) {

                                // на 5 снимок идет запрос

                                console.log('webcam: send search event');

                                this.notify('searchStart');

                                const snap = this.takeSnapshot();

                                snap.then(dataUri => {

                                    this.stopWebcam();
                                    this.pasteSnapshot(dataUri);
                                });
                            }
                        });
                    }
                });

                this.trackerTask = tracking.track(selector, objects);
            }
        }

        stopWebcam() {
            console.log('webcam: disconnecting');

            if (this.trackerTask) {

                console.log('webcam: stop tracking');

                this.trackerTask.stop();
            }

            Webcam.off('live')
            Webcam.reset();

            console.log('webcam: shut down');

        }

        pasteSnapshot(dataUri) {
            console.log('webcam: paste snapshot');

            this.innerHTML = '<img src="' + dataUri + '"/>';
        }

        takeSnapshot() {

            return new Promise((resolve, reject) => {
                Webcam.snap(dataUri => {

                    console.log('webcam: make snapshot');

                    resolve(dataUri);

                });
            });

        }

        disconnectedCallback() {

            this.stopWebcam();
        }

    });

})();