/// <reference path="typings/webrtc/MediaStream.d.ts" />
/// <reference path="typings/threejs/three.d.ts" />
/// <reference path="typings/threejs/three-vrcontrol.d.ts" />
/// <reference path="typings/threejs/three-vreffect.d.ts" />

module Oculus {
    export class Oculus{
        private _vrMode = false;
        private _vrAvailable = false;
        private _vrPositionScale = 25;
        private _vrControls: THREE.VRControls;
        private _vrEffect: THREE.VREffect;
        private _video: HTMLVideoElement;
        private _stats: HTMLElement;
        private _renderer = new THREE.WebGLRenderer({antialias: true});
        private _scene = new THREE.Scene();
        private _camera: THREE.Camera;
        private _videoTexture: THREE.Texture;
        private _videoMaterial: THREE.MeshBasicMaterial;

        private _dk1Width = 1280;
        private _dk1Height = 800;

        constructor(){

        }

        private _onFullscreenChange = () => {
            if (!(<any>document).webkitFullscreenElement && !(<any>document).mozFullScreenElement) {
                this._vrMode = false;
                this._camera.position.set(0, 0, 0);
                this._camera.quaternion.set(0, 0, 0, 1);
            }
            this._resize();
        };

        private _setupEvents(){
            window.addEventListener("resize", this._resize, false);

            window.addEventListener("keydown", (ev) => {
                if (ev.keyCode == "R".charCodeAt(0)) {
                    this._vrControls.zeroSensor();
                }
            });
            window.addEventListener("touchstart", (ev) => {
                this._vrControls.zeroSensor();
            });

            document.addEventListener("webkitfullscreenchange", this._onFullscreenChange, false);
            document.addEventListener("mozfullscreenchange", this._onFullscreenChange, false);
            document.body.appendChild(this._renderer.domElement);
        }

        public setupGl(){
            console.log('setupgl');
            var dolly = new THREE.Group();
            dolly.position.set(0, 0, 15);
            this._scene.add( dolly );

            this._camera = new THREE.PerspectiveCamera( 75, this._dk1Width / this._dk1Height, 0.1, 1000 );
            dolly.add(this._camera);

            this._renderer.setClearColor(0x202020, 1.0);

            var ambient = new THREE.AmbientLight( 0x333333 );
            this._scene.add(ambient);

            var directionalLight = new THREE.DirectionalLight( 0xdddddd );
            directionalLight.position.set( 0, 0, 1 ).normalize();
            this._scene.add(directionalLight);

            var mirrorMaterial = new THREE.MeshLambertMaterial({
                color: 0xaaaaaa
            });

            var riftOrigin = new THREE.Object3D();
            riftOrigin.position.set(0, 0, -15);
            this._scene.add(riftOrigin);


            var geometry = new THREE.CubeGeometry(50, 50, 0 );
            this._videoTexture = new THREE.Texture(this._video);  // なんとこれだけでテクスチャとして使える！
            this._videoTexture.minFilter = THREE.LinearFilter;
            this._videoTexture.magFilter = THREE.LinearFilter;
            this._videoTexture.format = THREE.RGBFormat;
            this._videoMaterial = new THREE.MeshBasicMaterial({  // マテリアルにする。カメラ画像をそのまま使いたいので、ライティング等は無し。
                map: this._videoTexture
            });

            var material = new THREE.MeshPhongMaterial( { color: 0xff0000 } );
            var mesh = new THREE.Mesh( geometry, this._videoMaterial );
            this._scene.add( mesh );

            // VR
            var vrBtn = document.getElementById("vrBtn");

            this._vrControls = new THREE.VRControls(this._camera);
            this._vrEffect = new THREE.VREffect(this._renderer, (error) => {
                if (error) {
                    this._stats.classList.add("error");
                    this._stats.innerHTML = "WebVR API not supported";
                    this._vrAvailable = false;
                }
            });





            this._vrControls.scale = this._vrPositionScale;
            this._camera.scale.x = this._vrPositionScale;
            this._camera.scale.y = this._vrPositionScale;
            this._camera.scale.z = this._vrPositionScale;


            this._resize();

            this._render();
        }

        private _resize(){
            (<any>this._camera).aspect = this._dk1Width / this._dk1Height;
            (<any>this._camera).updateProjectionMatrix();
            this._renderer.setSize(this._dk1Width, this._dk1Height);
            this._vrEffect.setSize(this._dk1Width, this._dk1Height);
        }

        private _render = ()=>{
            requestAnimationFrame(this._render);

            if(this._video.readyState !== this._video.HAVE_ENOUGH_DATA) return;

            if (this._videoTexture) this._videoTexture.needsUpdate = true;

            this._vrControls.update();

            if (this._vrMode) {
                this._vrEffect.render( this._scene, this._camera );
            } else {
                this._camera.position.set(0, 0, 0);
                this._camera.quaternion.set(0, 0, 0, 1);
                this._renderer.render( this._scene, this._camera );
            }
        };

        public init() {
            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || window.navigator.mozGetUserMedia;
            (<any>window).URL = (<any>window).URL || (<any>window).webkitURL;

            this._video = <HTMLVideoElement>document.getElementById('video');
            this._video.autoplay = true;

            var option = {
                video: { mandatory: { minWidth: this._dk1Width, minHeight: this._dk1Height} },
                audio: false
            };
            // var option = {video: true};

            navigator.getUserMedia(option, (stream)=>{
                    this._video.src = (<any>window).URL.createObjectURL(stream);
                },
                (err) => { // for error case
                    console.log(err);
                }
            );

            this._video.addEventListener('loadeddata', () => {
                // Chromeは問題無いが、Firefoxだと、'loadeddata' イベントでvideoWidthらが埋まっていないので、値が得られるまで待機
                var getVideoResolution = ()=>{
                    var vidWidth = this._video.videoWidth;
                    var vidHeight = this._video.videoHeight;
                    if(vidWidth != 0) {
                        console.log("video width: " + vidWidth + " height: " + vidHeight);
                        this._setupEvents();
                        this.setupGl();
                    } else {
                        setTimeout(getVideoResolution, 250);
                    }
                };

                getVideoResolution();
            });
        }

        public fullScreen(){
            this._vrMode = true;
            this._resize();
            this._vrEffect.setFullScreen( true );
        }
    }
}

