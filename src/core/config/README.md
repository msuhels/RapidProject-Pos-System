# Auth Configuration

## Files

- **`authConfigData.ts`** - Runtime configuration (Edge Runtime compatible)
- **`auth.config.json`** - Reference/documentation file
- **`authConfig.ts`** - Configuration loader and utilities

## Important Notes

### Edge Runtime Compatibility

The auth configuration system is designed to work in Next.js Edge Runtime (used by middleware). This means:

- ✅ **Use `authConfigData.ts`** - This TypeScript file is Edge Runtime compatible
- ❌ **Don't use `auth.config.json` directly** - JSON file reading is not available in Edge Runtime

### How to Update Configuration

1. **Edit `authConfigData.ts`** directly - This is the source of truth
2. Optionally sync values to `auth.config.json` for documentation

### Environment Variable Overrides

You can override specific settings using environment variables:

```env
AUTH_REGISTRATION_ENABLED=false
AUTH_ALLOW_PUBLIC_REGISTRATION=false
```

### Usage

```typescript
import { isRegistrationEnabled, getAuthConfig } from '@/core/config/authConfig';

// In middleware (Edge Runtime)
if (!isRegistrationEnabled()) {
  // Registration is disabled
}

// In API routes (Node.js Runtime)
const config = getAuthConfig();
```

## Configuration Options

See `AUTH_CONFIG.md` for detailed configuration options and examples.

