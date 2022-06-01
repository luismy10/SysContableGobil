module.exports = {
    apps: [
        {
            name: "govil-soft",
            script: "./server/index.js",
            watch: true,
            env: {
                "PORT": 5000,
                "NODE_ENV": "development"
            },
            env_production: {
                "PORT": 8000,
                "HOST": "127.0.0.1",
                "USER": "root",
                "PASSWORD": "",
                "DATABASE": "",
                "PORTHOST": 3306,
                "TZ": "America/Lima",
                "NODE_ENV": "production",
            }
        }
    ]
}