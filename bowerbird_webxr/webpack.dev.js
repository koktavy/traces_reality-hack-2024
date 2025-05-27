const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')
const path = require('path')
const os = require('os')

// Helper function to get local IP address
function getLocalIP() {
    const interfaces = os.networkInterfaces()
    for (const name of Object.keys(interfaces)) {
        for (const interface of interfaces[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (interface.family === 'IPv4' && !interface.internal) {
                return interface.address
            }
        }
    }
    return 'localhost'
}

module.exports = merge(common, {
    mode: 'development',
    devtool: 'eval-source-map',
    devServer: {
        static: {
            directory: path.join(__dirname, './'),
        },
        host: '0.0.0.0', // Bind to all network interfaces
        port: 8080,      // Explicit port
        hot: true,
        server: {
            type: 'https',
            // options: {
            //     cert: ...,
            //     key: ...,
            // },
        },
        open: true,
        allowedHosts: 'all', // Allow connections from any host
        client: {
            logging: 'info',
        },
        setupExitSignals: true,
        onListening: function (devServer) {
            if (!devServer) {
                throw new Error('webpack-dev-server is not defined');
            }

            const port = devServer.server.address().port;

            console.log('\n🚀 Development server is running:');
            console.log(`   Local:    https://localhost:${port}/`);
            console.log(`   Network:  https://${getLocalIP()}:${port}/`);
            console.log('\n📱 For VR headsets, use the Network URL\n');
        }
    },
})
