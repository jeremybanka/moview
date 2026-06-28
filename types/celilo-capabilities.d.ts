declare module "@celilo/capabilities" {
	type CapabilityName = `public_web` | `idp`

	type DeployedSystem = {
		hostname: string
		ipv4_address: string
		name: string
		zone: string
	}

	type HookLogger = {
		error(message: string): void
		info(message: string): void
		success(message: string): void
		warn(message: string): void
	}

	type HealthCheckItem = {
		details?: string
		message: string
		name: string
		status: `fail` | `pass` | `warn`
	}

	type HookOutput<Hook> = Hook extends `health_check`
		? {
				checks: HealthCheckItem[]
				status: `degraded` | `healthy` | `unhealthy`
			}
		: Record<string, unknown> | void

	type PublicWebCapability = {
		publishStaticSite(input: {
			clientConfig?: Record<string, boolean | number | string>
			hostname?: string
			path: string
			sourceDir: string
		}): Promise<{
			contentHash: string
			filesUploaded: number
			path: string
			success: boolean
		}>
		registerReverseProxy(input: {
			hostname?: string
			path: string
			targetHost: string
			targetPort: number
			websocket?: boolean
		}): Promise<{ path: string; success: boolean }>
	}

	type IdpCapability = {
		create_oidc_client(input: {
			client_name: string
			client_type?: `confidential` | `public`
			groups?: string[]
			redirect_uris: string[]
			scopes?: string[]
		}): Promise<{
			application_slug: string
			client_id: string
			client_secret: string
			provider_id: number
		}>
		create_user(input: {
			email: string
			groups?: string[]
			password: string
			username: string
		}): Promise<{ created: boolean; user_id: number }>
	}

	type CapabilityMap<Required extends readonly CapabilityName[]> =
		(`public_web` extends Required[number]
			? { public_web: PublicWebCapability }
			: {}) &
			(`idp` extends Required[number] ? { idp: IdpCapability } : {})

	export function defineHook<
		Config extends object,
		Required extends readonly CapabilityName[],
		Optional extends readonly CapabilityName[] = [],
		Hook extends string | undefined = undefined,
	>(definition: {
		handler(context: {
			capabilities: CapabilityMap<Required>
			config: Config
			debug: boolean
			logger: HookLogger
			screenshotDir: string
			secrets: Record<string, string>
			systems: DeployedSystem[]
		}): HookOutput<Hook> | Promise<HookOutput<Hook>>
		hook?: Hook
		optional?: Optional
		requires: Required
	}): (context: unknown) => Promise<HookOutput<Hook>>
}
