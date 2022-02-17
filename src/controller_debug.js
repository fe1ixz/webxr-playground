import './styles/main.css';

import * as THREE from 'three';

import { VRButton } from 'three/examples/jsm/webxr/VRButton';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory';
import { createText } from 'three/examples/jsm/webxr/Text2D';

const TEST_DURATION = 1;

let container;
let camera, scene, renderer;
let xrInputSource;
let gripMarker;

let inTestSession = false;
let testCompleted = false;
let clock = new THREE.Clock();
let testTimer = 0;
let resultsPanel;
let framesData;

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

	gripMarker = new THREE.Mesh(
		new THREE.BoxGeometry(0.05, 0.05, 0.05),
		new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
	);
	scene.add(gripMarker);
	gripMarker.visible = false;

	const controller = renderer.xr.getController(0);
	controller.addEventListener('connected', (event) => {
		xrInputSource = event.data;
	});
	scene.add(controller);

	const controllerModelFactory = new XRControllerModelFactory();

	const controllerGrip = renderer.xr.getControllerGrip(0);
	controllerGrip.add(
		controllerModelFactory.createControllerModel(controllerGrip),
	);
	resultsPanel = new THREE.Group();
	resultsPanel.rotateX(-Math.PI / 4);
	resultsPanel.position.y = 0.18;
	controllerGrip.add(resultsPanel);
	resultsPanel.add(
		createText(
			'Press trigger and move controller at even speed for 1 second',
			0.02,
		),
	);

	scene.add(controllerGrip);

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
	const xrSession = renderer.xr.getSession();
	if (xrSession) {
		const xrFrame = renderer.xr.getFrame();
		const xrReferenceSpace = renderer.xr.getReferenceSpace();
		if (xrInputSource)
			updateController(xrInputSource, xrFrame, xrReferenceSpace);
	}

	renderer.render(scene, camera);
}

function updateResultsPanel(text) {
	resultsPanel.remove(resultsPanel.children[0]);
	resultsPanel.add(createText(text, 0.02));
}

const findVariance = (arr = []) => {
	if (!arr.length) {
		return 0;
	}
	const sum = arr.reduce((acc, val) => acc + val);
	const { length: num } = arr;
	const median = sum / num;
	let variance = 0;
	arr.forEach((num) => {
		variance += (num - median) * (num - median);
	});
	variance /= num;
	return variance;
};

function processData() {
	const totalFrames = framesData.length;
	const validFrames = framesData.filter((frame) => frame.data != null);
	const invalidFrames = totalFrames - validFrames.length;
	const totalDistance = validFrames[validFrames.length - 1].data.distanceTo(
		validFrames[0].data,
	);
	const distances = [];
	for (let i = 0; i < validFrames.length - 1; i++) {
		let distance =
			validFrames[i + 1].data.distanceTo(validFrames[i].data) /
			validFrames[i + 1].delta;
		distances.push(distance);
	}
	const variance = findVariance(distances);
	console.log(invalidFrames, totalDistance, variance);
	return (
		'invalid frames: ' +
		invalidFrames +
		', total distance: ' +
		totalDistance +
		', variance: ' +
		variance
	);
}

function updateController(inputSource, frame, referenceSpace) {
	let gripPose = null;
	let triggerPressed = inputSource.gamepad.buttons[0].pressed;
	const delta = clock.getDelta();

	if (inTestSession && clock.getElapsedTime() - testTimer >= TEST_DURATION) {
		if (testCompleted == false) {
			testCompleted = true;
			updateResultsPanel(processData());
		}
	}

	if (!inTestSession && triggerPressed) {
		testCompleted = false;
		inTestSession = true;
		updateResultsPanel('test in progress');
		framesData = [];
		testTimer = clock.getElapsedTime();
	} else if (inTestSession && !triggerPressed) {
		inTestSession = false;
		if (!testCompleted) {
			updateResultsPanel('test invalid, try again');
		}
	}

	if (
		frame.session.visibilityState !== 'visible-blurred' &&
		!inputSource.hand &&
		inTestSession &&
		!testCompleted
	) {
		let frameData = { delta: delta, data: null };
		if (inputSource.gripSpace) {
			gripPose = frame.getPose(inputSource.gripSpace, referenceSpace);

			if (gripPose !== null) {
				gripMarker.visible = true;
				gripMarker.matrix.fromArray(gripPose.transform.matrix);
				gripMarker.matrix.decompose(
					gripMarker.position,
					gripMarker.rotation,
					gripMarker.scale,
				);
				frameData.data = gripMarker.position.clone();
			}
		}
		framesData.push(frameData);
	} else {
		gripMarker.visible = false;
	}
}
