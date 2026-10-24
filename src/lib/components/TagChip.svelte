<script lang="ts">
	/** `marked` sets the chip in the selection wash, for the tag being edited. */
	let { name, marked = false, href }: { name: string; marked?: boolean; href?: string } = $props();
</script>

<svelte:element
	this={href ? 'a' : 'span'}
	{href}
	title={name}
	class="inline-flex max-w-[16rem] min-w-0 items-center rounded-[3px] border px-1.5 text-sm leading-5 font-normal text-ink {marked
		? 'border-band/25 bg-select'
		: 'border-rule bg-ground'} {href ? 'transition-colors hover:border-ink-soft' : ''}"
>
	<span class="truncate">{name}</span>
</svelte:element>
