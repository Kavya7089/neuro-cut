"use client";

import React, { useEffect, useRef } from "react";

export default function BackgroundPhysics() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) return;

    const vsSource = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fsSource = `
      precision highp float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      varying vec2 v_texCoord;

      float hash(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
      }

      void main() {
          vec2 uv = v_texCoord;
          vec2 mouse = u_mouse / u_resolution;
          float t = u_time * 0.15;
          vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);

          // Deep charcoal base with subtle blue undertone
          vec3 color = vec3(0.031, 0.031, 0.047);

          // Aurora gradient mesh
          vec2 p1 = uv + vec2(sin(t * 0.7) * 0.08, cos(t * 0.5) * 0.06);
          vec2 p2 = uv + vec2(cos(t * 0.4) * 0.1, sin(t * 0.6) * 0.08);
          float aurora1 = exp(-length((p1 - vec2(0.3 + sin(t)*0.1, 0.7))*aspect) * 2.5) * 0.15;
          float aurora2 = exp(-length((p2 - vec2(0.75 + cos(t)*0.08, 0.25))*aspect) * 3.0) * 0.10;
          color += vec3(0.0, 0.45, 0.65) * aurora1;
          color += vec3(0.35, 0.15, 0.65) * aurora2;

          // Floating objects with interactive mouse disturbance
          vec3 objectsColor = vec3(0.0);
          for(float i = 0.0; i < 45.0; i++) {
              float h1 = hash(vec2(i, 1.0));
              float h2 = hash(vec2(i, 2.0));
              float speed = 0.02 + h1 * 0.04;
              
              // Base position moving slowly
              vec2 basePos = vec2(h1, fract(h2 * 97.0 + t * speed));
              
              vec2 pToMouse = (basePos - mouse) * aspect;
              float distToMouse = length(pToMouse);
              
              // Mouse disturbance (repel)
              vec2 disturbance = vec2(0.0);
              float radius = 0.25; // Interaction radius
              if (distToMouse < radius) {
                  float force = smoothstep(radius, 0.0, distToMouse);
                  // Repel outwards
                  vec2 dir = pToMouse / (distToMouse + 0.001);
                  disturbance = dir * force * 0.08;
              }
              
              vec2 finalPos = basePos + disturbance + (mouse - 0.5) * 0.05 * h1;
              
              vec2 localUv = (uv - finalPos) * aspect;
              
              // Rotation
              float angle = t * (h1 - 0.5) * 4.0;
              float c = cos(angle);
              float s = sin(angle);
              localUv = vec2(localUv.x * c - localUv.y * s, localUv.x * s + localUv.y * c);
              
              float d;
              // Mix of shapes: circles and rotated squares (diamonds)
              if (h2 > 0.5) {
                  d = length(localUv); // Circle
              } else {
                  d = abs(localUv.x) + abs(localUv.y); // Diamond
              }
              
              float size = 0.003 + h1 * 0.006;
              float glow = exp(-d * (40.0 - h1 * 10.0)) * 0.4;
              float core = smoothstep(size, size * 0.8, d);
              
              float pulse = 0.6 + 0.4 * sin(u_time * 1.5 + h1 * 20.0);
              
              // Color variation
              vec3 objColor = mix(vec3(0.1, 0.8, 0.95), vec3(0.6, 0.2, 0.9), h2);
              
              objectsColor += (core + glow) * pulse * objColor;
          }
          color += objectsColor;

          // Subtle vignette
          float vignette = 1.0 - length(uv - 0.5) * 0.7;
          color *= vignette;

          gl_FragColor = vec4(color, 1.0);
      }
    `;

    function createShader(gl: WebGLRenderingContext, type: number, source: string) {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]),
      gl.STATIC_DRAW
    );

    const positionLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, "u_time");
    const uRes = gl.getUniformLocation(program, "u_resolution");
    const uMouse = gl.getUniformLocation(program, "u_mouse");

    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) {
        mouse.x = ((event.clientX - rect.left) / rect.width) * canvas.width;
        mouse.y = (1.0 - (event.clientY - rect.top) / rect.height) * canvas.height;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);

    function syncSize() {
      if (!canvas || !gl) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    }

    window.addEventListener("resize", syncSize);
    syncSize();

    let animationId: number;
    function render(time: number) {
      if (!canvas || !gl) return;
      syncSize();
      gl.uniform1f(uTime, time * 0.001);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationId = requestAnimationFrame(render);
    }

    animationId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", syncSize);
      cancelAnimationFrame(animationId);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(positionBuffer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      aria-hidden="true"
    />
  );
}
