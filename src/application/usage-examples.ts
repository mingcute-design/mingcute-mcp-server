import type { MingcuteStyleFilter, UsageFramework } from '../domain/icon.js';
import { IconSearchRepository } from '../infrastructure/search/icon-search.repository.js';
import { resolveIcon } from './get-icon.usecase.js';

export class UsageExamples {
  constructor(private readonly repository: IconSearchRepository) {}
  execute(input: { name: string; style?: MingcuteStyleFilter; framework: UsageFramework }): string {
    const { icon, style } = resolveIcon(this.repository, input.name, input.style);
    const variant =
      icon.variants[style === 'all' ? 'core-regular' : style] ?? Object.values(icon.variants)[0];
    if (!variant) throw new Error('This icon has no available variants.');
    const component = variant.componentName;
    const framework = input.framework;
    const importFor = (pkg: string) => `import { ${component} } from '@mingcute/${pkg}/${variant.style}';`;
    const install = (pkg: string) => `npm install @mingcute/${pkg}\n\n`;
    switch (framework) {
      case 'react':
      case 'solid':
        return (
          install(framework) +
          importFor(framework) +
          `\n\n<${component} size={24} title="${icon.baseName}" />`
        );
      case 'react-native':
        return (
          `npm install @mingcute/react-native react-native-svg\n\n` +
          importFor(framework) +
          `\n\n<${component} size={24} color="#10161F" accessibilityLabel="${icon.baseName}" />`
        );
      case 'vue':
        return (
          install(framework) +
          `<script setup>\n${importFor(framework)}\n</script>\n\n<template>\n  <${component} :size="24" title="${icon.baseName}" />\n</template>`
        );
      case 'svelte':
        return (
          install(framework) +
          `<script>\n${importFor(framework)}\n</script>\n\n<${component} size={24} title="${icon.baseName}" />`
        );
      case 'vanilla':
        return (
          install(framework) +
          `import { createIcon } from '@mingcute/vanilla';\n${importFor(framework)}\n\ndocument.querySelector('nav')?.append(createIcon(${component}, { size: 24, title: '${icon.baseName}' }));`
        );
      case 'web-components': {
        const suffix = variant.style === 'core-regular' ? 'regular' : 'filled';
        return (
          install(framework) +
          `import { define${component} } from '@mingcute/web-components/${variant.style}/${icon.baseName}';\n\ndefine${component}();\n\n<mingcute-${icon.baseName}-${suffix} size="24" title="${icon.baseName}"></mingcute-${icon.baseName}-${suffix}>`
        );
      }
      case 'webfont':
        return (
          install('font') +
          `import '@mingcute/font/${variant.style}.min.css';\n\n<i class="mgc ${variant.webfontClass}" aria-hidden="true"></i>\n\nDecorative icon: keep an accessible text label on its containing control.`
        );
      case 'svg':
        return (
          install('svg') +
          `import iconUrl from '@mingcute/svg/${variant.svgPath}?url';\n\nconst image = document.createElement('img');\nimage.src = iconUrl;\nimage.alt = '';\nimage.width = 24;\nimage.height = 24;\ndocument.querySelector('nav')?.append(image);\n\nThe ?url suffix is for Vite. For other bundlers, configure SVG asset imports or use get_icon with includeSvg=true for inline SVG.`
        );
      case 'data': {
        const definition = component.replace(/(?:Regular|Filled)$/, 'Icon');
        return (
          install('icons') +
          `import { ${definition} } from '@mingcute/icons/${variant.style}';\n\nconsole.log(${definition});`
        );
      }
      default:
        throw new Error('Unsupported framework.');
    }
  }
}
