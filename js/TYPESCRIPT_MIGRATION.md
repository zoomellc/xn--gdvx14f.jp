# TypeScript Migration Guide for 敬語.jp

## Overview
This guide documents the gradual migration of JavaScript to TypeScript for the 敬語.jp project.

## Setup Complete ✅
1. Added TypeScript dependencies to package.json
2. Created tsconfig.json with appropriate settings
3. Set up directory structure:
   - `/static/js/src/` - TypeScript source files
   - `/static/js/types/` - Type definitions
   - `/static/js/dist/` - Compiled JavaScript output
4. Created global type definitions in `types/global.d.ts`

## Migration Process

### For each module:
1. Copy the `.js` file to `/static/js/src/` with `.ts` extension
2. Add type annotations gradually
3. Update imports/exports to use ES modules
4. Compile and test
5. Update bundle references to use compiled version
6. Remove original `.js` file once stable

### Build Process:
```bash
# Development
npm run watch:ts  # Watch TypeScript files

# Production
npm run build:ts  # Compile TypeScript
npm run build     # Full build including TS compilation
```

## Migration Status

### Phase 1 - Core Infrastructure
- [ ] bundle-loader.js → bundle-loader.ts
- [ ] Create shared interfaces and types

### Phase 2 - High Priority Modules
- [ ] honorific-dictionary.js
- [ ] honorific-converter.js  
- [ ] search.js

### Phase 3 - Medium Priority Modules
- [ ] comment-system.js
- [ ] user-profile.js
- [ ] feedback-system.js
- [ ] learning-plan-manager.js

### Phase 4 - Utility Modules
- [ ] dark-mode.js
- [ ] lazy-load.js
- [ ] font-size-adjuster.js
- [ ] Other utility modules

## Type Definition Guidelines

1. **Global Types**: Define in `types/global.d.ts`
2. **Module-specific Types**: Define at top of each module file
3. **Shared Types**: Create separate type files in `types/` directory
4. **Third-party Types**: Install @types packages when available

## Best Practices

1. **Gradual Adoption**: Start with simple type annotations
2. **Maintain Compatibility**: Ensure compiled JS works with existing code
3. **Use Strict Mode**: Enable strict checks for better type safety
4. **Document Types**: Add JSDoc comments for complex types
5. **Test Thoroughly**: Verify functionality after each migration

## Common Patterns

### Event Listeners
```typescript
element.addEventListener('click', (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  // ...
});
```

### Local Storage
```typescript
const data = localStorage.getItem('key');
if (data) {
  const parsed: MyType = JSON.parse(data);
}
```

### Module Pattern
```typescript
class MyModule {
  private property: string;
  
  constructor() {
    this.property = 'value';
  }
  
  public init(): void {
    // initialization
  }
}

export default MyModule;
```

## Troubleshooting

- **Import Issues**: Use `.js` extension in imports for Hugo compatibility
- **Global Variables**: Declare in `global.d.ts` or use `declare global`
- **Build Errors**: Check tsconfig.json paths and module resolution