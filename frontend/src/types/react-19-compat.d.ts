/**
 * React 19 Compatibility Type Augmentations
 *
 * TEMPORARY FIX: Bridges type gap between React 19 and React 18-era libraries
 *
 * Problem: react-router-dom@7.9.5 and lucide-react@0.553.0 have React 18 type
 * definitions that return ReactElement, but React 19 JSX expects ReactNode.
 *
 * Root Cause: React 19's JSXElementConstructor type definition expects:
 *   (props: P) => ReactNode | Promise<ReactNode>
 * But React 18 libraries define:
 *   (props: P) => ReactElement | null
 *
 * Solution: Declare these library modules as returning 'any' so TypeScript
 * doesn't perform strict JSX type checking on them. The libraries still work
 * at runtime; we're just relaxing TypeScript's compile-time checking.
 *
 * REMOVE AFTER: ADR-003 approval and library updates to React 19-compatible versions.
 *
 * @see https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/69006
 * @see CLAUDE.md - Known Issues section
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// Declare library modules with relaxed types to bypass React 19 JSX strictness
declare module 'react-router-dom' {
  export const Routes: any;
  export const Route: any;
  export const Link: any;
  export const BrowserRouter: any;

  // Hooks need proper generic support
  export function useNavigate(): any;
  export function useParams<T extends Record<string, string | undefined>
    = Record<string, string | undefined>>(): T;
  export function useLocation(): any;
  export function useSearchParams(): any;
}

declare module 'lucide-react' {
  export const Flame: any;
  export const Tv: any;
  export const ChevronDown: any;
  export const Menu: any;
  export const ChevronLeft: any;
  export const ChevronRight: any;
  export const ArrowLeft: any;
  export const Calendar: any;
  export const Radio: any;
  export const Circle: any;
  export const Info: any;
  export const CheckCircle: any;
  export const XCircle: any;
  export const AlertCircle: any;
}
