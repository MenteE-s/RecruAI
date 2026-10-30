// Video is opt-in: the UI hides video entry points unless the build explicitly
// enables them. The backend independently requires LiveKit config when
// VIDEO_ENABLED=1, so this flag cannot turn an unconfigured server into a dead
// call.
export const VIDEO_ENABLED = process.env.REACT_APP_VIDEO_ENABLED === "true";
