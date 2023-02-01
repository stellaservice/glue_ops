#!/usr/bin/env groovy

pipeline {
  agent {
    label 'general'
  }

  options {
    ansiColor('xterm')
    buildDiscarder(logRotator(numToKeepStr: '30', daysToKeepStr: '7'))
  }
  environment {
    DOCKER_REGISTRY = 'virtual-docker.artifactory.eng.medallia.com'
    DOCKER_REPOSITORY = 'medallia/stella-connect/glue_ops'
    DOCKER_IMAGE = "${DOCKER_REGISTRY}/${DOCKER_REPOSITORY}"
  }

  stages {
    stage('CI') {
      agent {
        docker {
          image "node:14.17.6-stretch"
          args "-u 0"
        }
      }

      steps {
        sh("npm install")
        sh("npm run lint")
        sh("npx jest")
      }
    }

    stage('Publish') {
      when { buildingTag() }

      steps {
        sh("docker build -t ${DOCKER_IMAGE}:${TAG_NAME} .")
        sh("docker push ${DOCKER_IMAGE}:${TAG_NAME}")

        sh("npm config set registry https://artifactory.eng.medallia.com/api/npm/virtual-npm/")
        sh("npm publish")
      }
    }
  }
}
