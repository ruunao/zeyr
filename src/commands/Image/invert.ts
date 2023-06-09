import { decodeWEBP, getLastMedia } from '../../lib/utils';
import { Command } from '@kaname-png/plugin-subcommands-advanced';
import { ApplyOptions } from '@sapphire/decorators';
import { Stopwatch } from '@sapphire/stopwatch';
import { AttachmentBuilder, TextChannel } from 'discord.js';
import { Image } from 'imagescript';

@ApplyOptions<Command.Options>({
    registerSubCommand: {
        parentCommandName: 'image',
        slashSubcommand: (builder) => builder.setName('invert').setDescription('Inverts the images colors')
        .addAttachmentOption((o) => o.setName("image").setDescription("Image to invert").setRequired(false))
    }
})
export class UserCommand extends Command {
	public override async chatInputRun(
		interaction: Command.ChatInputInteraction
	) {
		await interaction.deferReply({ fetchReply: true });
		const stopwatch = new Stopwatch();

		const image =
			interaction.options.getAttachment('image')?.proxyURL ??
			(await getLastMedia(interaction.channel as TextChannel).then(
				(i) => i?.proxyURL || i?.url
			));

		if (!image)
			return interaction.editReply({
				content: 'Please provide a valid image'
			});

		const inverted = (await fetch(image)
			.then((img) => img.arrayBuffer())
			.then(async (b) => decodeWEBP(b as Buffer))
			.catch((e: Error) =>
				interaction.editReply({
					content: `❎ ${e.message}`
				})
			)) as Image;

		inverted.invert();

		const buffer = await inverted.encode().then((i) => i.buffer);
		const file = new AttachmentBuilder(Buffer.from(buffer), {
			name: 'inverted.png'
		});

		return interaction.editReply({
			content: `✅ Done, took ${stopwatch.stop().toString()}`,
			files: [file]
		});
	}
}
