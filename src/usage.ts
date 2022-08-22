const usage = (): void => {
  console.log(
    `
Usage: npm-offline-mirror --version
       npm-offline-mirror --help

Mirror dependencies to TAR archives in a
local directory for offline installation.

Options:
  --version  Display the current version
  --help     Display this help text
    `.trim() + '\n',
  );
};

export { usage };
