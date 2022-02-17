import * as THREE from 'three';

import { VRButton } from 'three/examples/jsm/webxr/VRButton';

let container;
let camera, scene, renderer;

init();
animate();

function init() {
	container = document.createElement('div');
	document.body.appendChild(container);

	scene = new THREE.Scene();
	scene.background = new THREE.Color(0x444444);

	camera = new THREE.PerspectiveCamera(
		50,
		window.innerWidth / window.innerHeight,
		0.1,
		10,
	);
	camera.position.set(0, 1.6, 1);

	const geometry = new THREE.BoxGeometry();
	const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
	const cube = new THREE.Mesh(geometry, material);
	cube.scale.set(0.1, 0.1, 0.1);
	scene.add(cube);

	const floorGeometry = new THREE.PlaneGeometry(4, 4);
	const floorMaterial = new THREE.MeshStandardMaterial({
		color: 0x222222,
	});
	const floor = new THREE.Mesh(floorGeometry, floorMaterial);
	floor.rotation.x = -Math.PI / 2;
	floor.receiveShadow = true;
	scene.add(floor);

	scene.add(new THREE.HemisphereLight(0x808080, 0x606060));

	const light = new THREE.DirectionalLight(0xffffff);
	light.position.set(0, 6, 0);
	scene.add(light);

	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.outputEncoding = THREE.sRGBEncoding;
	renderer.shadowMap.enabled = true;
	renderer.xr.enabled = true;

	container.appendChild(renderer.domElement);

	container.appendChild(VRButton.createButton(renderer));

	window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
	renderer.setAnimationLoop(render);
}

function render() {
	renderer.render(scene, camera);
}
