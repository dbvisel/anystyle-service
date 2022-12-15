const { logger } = require('@coko/server')
const fs = require('fs-extra')
const { authenticate } = require('@coko/service-auth')
const crypto = require('crypto')

const { exec } = require('child_process')

const { uploadHandler } = require('./helpers')

const conversionHandler = async (req, res) => {
  const id = crypto.randomBytes(16).toString('hex')

  try {
    if (req.fileValidationError) {
      return res.status(400).json({ msg: req.fileValidationError })
    }

    if (!req.file) {
      return res.status(400).json({ msg: 'text file is not included' })
    }

    const { path: filePath } = req.file

    fs.ensureDir('temp')

    const out = `temp/${id}`

    fs.ensureDir(out)

    logger.info(`Sending temp/${id} to Anystyle`)
    let output = ''

    await new Promise((resolve, reject) => {
      exec(`anystyle -f xml parse ${filePath}`, (error, stdout, stderr) => {
        if (error) {
          return reject(error)
        }

        logger.info(stdout)
        output = stdout
        return resolve(stdout || stderr)
      })
    })

    logger.info(`removing ${filePath}`)
    await fs.remove(filePath)

    if (!output) {
      return res.status(500).json({ msg: 'Error, Anystyle conversion failed' })
    }

    res.on('finish', async () => {
      logger.info(`removing folder temp/${id}`)
      await fs.remove(`temp/${id}`)
    })

    req.on('error', async err => {
      logger.error(err.message)
      await fs.remove(`temp/${id}`)
    })

    res.writeHead(200, {
      'Content-Type': 'text/xml',
    })
    res.write(output)
    res.end()
  } catch (e) {
    return res.status(500).json({ msg: e.message })
  }
}

const getToolsInfo = async (req, res) => {
  try {
    const nodeVersion = await new Promise((resolve, reject) => {
      exec(`node --version`, (error, stdout, stderr) => {
        if (error) {
          return reject(error)
        }

        return resolve(stdout.split('v')[1].trim() || stderr)
      })
    })

    const npmVersion = await new Promise((resolve, reject) => {
      exec(`npm --version`, (error, stdout, stderr) => {
        if (error) {
          return reject(error)
        }

        return resolve(stdout.trim() || stderr)
      })
    })

    const alpineVersion = await new Promise((resolve, reject) => {
      exec(`cat /etc/alpine-release`, (error, stdout, stderr) => {
        if (error) {
          return reject(error)
        }

        return resolve(stdout.trim() || stderr)
      })
    })

    const rubyVersion = await new Promise((resolve, reject) => {
      exec(`ruby --version`, (error, stdout, stderr) => {
        if (error) {
          return reject(error)
        }

        return resolve(stdout.split(' ')[1].trim() || stderr)
      })
    })

    const anystyleVersion = await new Promise((resolve, reject) => {
      exec(`anystyle --version`, (error, stdout, stderr) => {
        if (error) {
          logger.info(`can't find anystyle command!`)
          return reject(error)
        }

        return resolve(stdout.split(' ')[2].trim() || stderr)
      })
    })

    const result = {
      alpineLinux: alpineVersion,
      node: nodeVersion,
      npm: npmVersion,
      ruby: rubyVersion,
      anystyle: anystyleVersion,
    }

    return res.status(200).json(result)
  } catch (e) {
    return res.status(500).json({ msg: e.message })
  }
}

const stringToXMLBackend = app => {
  app.post(
    '/api/referencesToXml',
    authenticate,
    uploadHandler,
    conversionHandler,
  )
  app.use('/info', authenticate, getToolsInfo)
}

module.exports = stringToXMLBackend
