import { Disposable } from "@hediet/std/disposable";
import * as vsls from "vsls";
import { Config } from "../../Config";
import { DrawioEditorManager } from "../../DrawioEditorManager";
import { autorunTrackDisposables } from "../../utils/autorunTrackDisposables";
import { fromResource } from "../../utils/fromResource";
import { LiveshareSession } from "./LiveshareSession";

export class LiveshareFeature {
	public readonly dispose = Disposable.fn();

	constructor(
		private readonly editorManager: DrawioEditorManager,
		private readonly config: Config
	) {
		this.init().catch(console.error);
	}

	private async init() {
		const liveshare = await vsls.getApi("hediet.vscode-drawio");
		if (!liveshare) {
			console.warn("Could not get liveshare API");
			return;
		}
		this.dispose.track(
			new LiveshareFeatureInitialized(liveshare, this.editorManager)
		);
	}
}

class LiveshareFeatureInitialized {
	public readonly dispose = Disposable.fn();

	private session = fromResource(
		(sink) => {
			this.api.onDidChangeSession(() => {
				sink();
			});
		},
		() => {
			if (this.api.session.role === vsls.Role.None) {
				return undefined;
			} else {
				return Object.assign({}, this.api.session);
			}
		}
	);

	constructor(
		private readonly api: vsls.LiveShare,
		editorManager: DrawioEditorManager
	) {
		this.dispose.track(
			autorunTrackDisposables(async (track) => {
				const session = this.session.current();
				if (!session) {
					return;
				}
				track(new LiveshareSession(api, session, editorManager));
			})
		);
	}
}
