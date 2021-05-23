const commands = [
  'AddObjectCommand',
  'RemoveObjectCommand',
  'SetPositionCommand',
  'SetRotationCommand',
  'SetScaleCommand',
  'SetSceneCommand',
  'SetUuidCommand',
  'SetValueCommand',
] as const;

export type CommandTypes = typeof commands[number];
