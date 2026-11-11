import { describe, it, expect } from 'vitest';
import { buildSpec, renderMockup, classifyType } from '~/lib/mockup';

describe('mockup buildSpec', () => {
  // 5 questions flow:
  // q0 = "¿Quién es el usuario principal y qué problema concreto le resuelve?"
  // q1 = "¿En qué plataforma lo imaginas: web app, mobile, desktop...?"
  // q2 = "¿Cuál es la sensación que quieres transmitir...?"
  // q3 = "¿Tienes referencia visual que te guste...?"
  // q4 = "¡Ya tengo todo! Dame un segundo para generar tu mockup..."

  it('correctly maps answers: name from idea (multi-word), user/problem from answers[1], platform from answers[2], feel from answers[3], refs from answers[4]', () => {
    const answers = [
      { q: '0', a: 'Una app de finanzas personales para controlar gastos' },       // answers[0] = idea
      { q: '1', a: 'Juan Pérez; controlar gastos diarios' },                     // answers[1] = user + problem (q0)
      { q: '2', a: 'mobile' },                                                  // answers[2] = platform (q1)
      { q: '3', a: 'colorido' },                                               // answers[3] = feel (q2)
      { q: '4', a: 'estilo Apple, colores neutros' },                          // answers[4] = refs (q3)
    ];

    const spec = buildSpec(answers, 0);

    // name: up to 3 words from idea, truncated to 24 chars
    expect(spec.name).toBe('Una app de'); // 3 words = "Una app de", but we need to check exact behavior

    // user from answers[1] (first part before ; or . or ,)
    expect(spec.user).toBe('Juan Pérez');

    // problem from answers[1] (second part after ; or . or ,)
    expect(spec.problem).toBe('controlar gastos diarios');

    // platform from answers[2] (NOT from answers[3])
    expect(spec.platform).toBe('mobile');

    // feel from answers[3] (NOT from answers[4])
    expect(spec.feel).toBe('colorido');

    // refs from answers[4] (NOT from answers[3])
    expect(spec.refs).toBe('estilo Apple, colores neutros');
  });

  it('platform is NOT taken from answers[3] and feel is NOT taken from answers[4] (regression guard)', () => {
    const answers = [
      { q: '0', a: 'Test idea' },
      { q: '1', a: 'Test user; test problem' },
      { q: '2', a: 'desktop' },          // platform = desktop
      { q: '3', a: 'colorido' },        // feel = colorido (should NOT come from answers[4])
      { q: '4', a: 'some refs' },       // refs = some refs (should NOT come from answers[3])
    ];

    const spec = buildSpec(answers, 0);

    // Platform must come from answers[2], not answers[3]
    expect(spec.platform).toBe('desktop');

    // Feel must come from answers[3], not answers[4]
    expect(spec.feel).toBe('colorido');

    // Refs must come from answers[4], not answers[3]
    expect(spec.refs).toBe('some refs');
  });

  it('fallbacks when answers[1] is missing: user="usuario", problem="tarea principal"', () => {
    const answers = [
      { q: '0', a: 'Test idea' },
      { q: '1', a: undefined as string | undefined },
      { q: '2', a: 'web' },
      { q: '3', a: 'minimalista' },
      { q: '4', a: '' },
    ];

    const spec = buildSpec(answers, 0);

    expect(spec.user).toBe('usuario');
    expect(spec.problem).toBe('tarea principal');
  });

  it('renderMockup returns valid SVG starting with <svg and ending with </svg>', () => {
    const answers = [
      { q: '0', a: 'Una app de finanzas' },
      { q: '1', a: 'María; controlar gastos' },
      { q: '2', a: 'mobile' },
      { q: '3', a: 'colorido' },
      { q: '4', a: 'referencias' },
    ];

    const spec = buildSpec(answers, 0);
    const svg = renderMockup(spec);

    expect(svg).toMatch(/^<svg/);
    expect(svg).toMatch(/<\/svg>$/);
  });

  it('renderMockup does NOT use forbidden tokens (var(--lava-) or #rrggbb hex colors)', () => {
    const answers = [
      { q: '0', a: 'Una app de finanzas' },
      { q: '1', a: 'María; controlar gastos' },
      { q: '2', a: 'mobile' },
      { q: '3', a: 'colorido' },
      { q: '4', a: 'referencias' },
    ];

    const spec = buildSpec(answers, 0);
    const svg = renderMockup(spec);

    // No var(--lava-) in SVG
    expect(svg).not.toMatch(/var\(--lava-/);
    // No hardcoded hex colors like #rrggbb (6-digit)
    expect(svg).not.toMatch(/#([0-9a-fA-F]{6})\b/);
  });

  it('classifyType correctly identifies types from answers', () => {
    // dashboard type
    expect(classifyType(['dashboard con metricas', 'web', 'profesional', 'minimalista', 'refs'])).toBe('dashboard');

    // mobile type
    expect(classifyType(['app mobile para transporte', 'mobile', 'colorido', 'organico', 'refs'])).toBe('mobile');

    // ecommerce type
    expect(classifyType(['tienda online de ropa', 'web', 'colorido', 'futurista', 'refs'])).toBe('ecommerce');

    // landing type
    expect(classifyType(['landing de presentación', 'web', 'minimalista', 'futurista', 'refs'])).toBe('landing');

    // tool type (default)
    expect(classifyType(['alguna herramienta', 'web', 'minimalista', 'organico', 'refs'])).toBe('tool');
  });
});