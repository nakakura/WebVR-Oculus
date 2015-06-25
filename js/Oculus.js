/// <reference path="typings/webrtc/MediaStream.d.ts" />
/// <reference path="typings/threejs/three.d.ts" />
/// <reference path="typings/threejs/three-vrcontrol.d.ts" />
/// <reference path="typings/threejs/three-vreffect.d.ts" />
var Oculus;
(function (_Oculus) {
    var Oculus = (function () {
        function Oculus() {
            var _this = this;
            this._vrMode = false;
            this._vrAvailable = false;
            this._vrPositionScale = 25;
            this._renderer = new THREE.WebGLRenderer({ antialias: true });
            this._scene = new THREE.Scene();
            this._dk1Width = 1280;
            this._dk1Height = 800;
            this._onFullscreenChange = function () {
                if (!document.webkitFullscreenElement && !document.mozFullScreenElement) {
                    _this._vrMode = false;
                    _this._camera.position.set(0, 0, 0);
                    _this._camera.quaternion.set(0, 0, 0, 1);
                }
                _this._resize();
            };
            this._render = function () {
                requestAnimationFrame(_this._render);
                if (_this._video.readyState !== _this._video.HAVE_ENOUGH_DATA)
                    return;
                if (_this._videoTexture)
                    _this._videoTexture.needsUpdate = true;
                _this._vrControls.update();
                if (_this._vrMode) {
                    _this._vrEffect.render(_this._scene, _this._camera);
                }
                else {
                    _this._camera.position.set(0, 0, 0);
                    _this._camera.quaternion.set(0, 0, 0, 1);
                    _this._renderer.render(_this._scene, _this._camera);
                }
            };
        }
        Oculus.prototype._setupEvents = function () {
            var _this = this;
            window.addEventListener("resize", this._resize, false);
            window.addEventListener("keydown", function (ev) {
                if (ev.keyCode == "R".charCodeAt(0)) {
                    _this._vrControls.zeroSensor();
                }
            });
            window.addEventListener("touchstart", function (ev) {
                _this._vrControls.zeroSensor();
            });
            document.addEventListener("webkitfullscreenchange", this._onFullscreenChange, false);
            document.addEventListener("mozfullscreenchange", this._onFullscreenChange, false);
            document.body.appendChild(this._renderer.domElement);
        };
        Oculus.prototype.setupGl = function () {
            var _this = this;
            console.log('setupgl');
            var dolly = new THREE.Group();
            dolly.position.set(0, 0, 15);
            this._scene.add(dolly);
            this._camera = new THREE.PerspectiveCamera(75, this._dk1Width / this._dk1Height, 0.1, 1000);
            dolly.add(this._camera);
            this._renderer.setClearColor(0x202020, 1.0);
            var ambient = new THREE.AmbientLight(0x333333);
            this._scene.add(ambient);
            var directionalLight = new THREE.DirectionalLight(0xdddddd);
            directionalLight.position.set(0, 0, 1).normalize();
            this._scene.add(directionalLight);
            var mirrorMaterial = new THREE.MeshLambertMaterial({
                color: 0xaaaaaa
            });
            var riftOrigin = new THREE.Object3D();
            riftOrigin.position.set(0, 0, -15);
            this._scene.add(riftOrigin);
            var geometry = new THREE.CubeGeometry(50, 50, 0);
            this._videoTexture = new THREE.Texture(this._video); // なんとこれだけでテクスチャとして使える！
            this._videoTexture.minFilter = THREE.LinearFilter;
            this._videoTexture.magFilter = THREE.LinearFilter;
            this._videoTexture.format = THREE.RGBFormat;
            this._videoMaterial = new THREE.MeshBasicMaterial({
                map: this._videoTexture
            });
            var material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
            var mesh = new THREE.Mesh(geometry, this._videoMaterial);
            this._scene.add(mesh);
            // VR
            var vrBtn = document.getElementById("vrBtn");
            this._vrControls = new THREE.VRControls(this._camera);
            this._vrEffect = new THREE.VREffect(this._renderer, function (error) {
                if (error) {
                    _this._stats.classList.add("error");
                    _this._stats.innerHTML = "WebVR API not supported";
                    _this._vrAvailable = false;
                }
            });
            this._vrControls.scale = this._vrPositionScale;
            this._camera.scale.x = this._vrPositionScale;
            this._camera.scale.y = this._vrPositionScale;
            this._camera.scale.z = this._vrPositionScale;
            this._resize();
            this._render();
        };
        Oculus.prototype._resize = function () {
            this._camera.aspect = this._dk1Width / this._dk1Height;
            this._camera.updateProjectionMatrix();
            this._renderer.setSize(this._dk1Width, this._dk1Height);
            this._vrEffect.setSize(this._dk1Width, this._dk1Height);
        };
        Oculus.prototype.init = function () {
            var _this = this;
            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || window.navigator.mozGetUserMedia;
            window.URL = window.URL || window.webkitURL;
            this._video = document.getElementById('video');
            this._video.autoplay = true;
            var option = {
                video: { mandatory: { minWidth: this._dk1Width, minHeight: this._dk1Height } },
                audio: false
            };
            // var option = {video: true};
            navigator.getUserMedia(option, function (stream) {
                _this._video.src = window.URL.createObjectURL(stream);
            }, function (err) {
                console.log(err);
            });
            this._video.addEventListener('loadeddata', function () {
                // Chromeは問題無いが、Firefoxだと、'loadeddata' イベントでvideoWidthらが埋まっていないので、値が得られるまで待機
                var getVideoResolution = function () {
                    var vidWidth = _this._video.videoWidth;
                    var vidHeight = _this._video.videoHeight;
                    if (vidWidth != 0) {
                        console.log("video width: " + vidWidth + " height: " + vidHeight);
                        _this._setupEvents();
                        _this.setupGl();
                    }
                    else {
                        setTimeout(getVideoResolution, 250);
                    }
                };
                getVideoResolution();
            });
        };
        Oculus.prototype.fullScreen = function () {
            this._vrMode = true;
            this._resize();
            this._vrEffect.setFullScreen(true);
        };
        return Oculus;
    })();
    _Oculus.Oculus = Oculus;
})(Oculus || (Oculus = {}));
//# sourceMappingURL=Oculus.js.map