package batchai

import (
	"context"
	"crypto/tls"
	"encoding/base64"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/openai/openai-go"
	"github.com/openai/openai-go/option"
	"github.com/pkg/errors"
)

type ModelClientT struct {
	config       ModelConfig
	openAiClient *openai.Client
	semaphore    chan struct{}
}

type ModelClient = *ModelClientT

func NewModelClient(config ModelConfig) ModelClient {
	return &ModelClientT{
		config:       config,
		openAiClient: buildOpenAiClient(config),
		semaphore:    make(chan struct{}, 1),
	}
}

func buildModelClient(config AppConfig, modelId string) ModelClient {
	model := config.LoadModel(modelId)
	return NewModelClient(model)
}

func (me ModelClient) acquire() {
	me.semaphore <- struct{}{}
}

func (me ModelClient) release() {
	<-me.semaphore
}

func (me ModelClient) Chat(x Kontext, memory ChatMemory) (*openai.ChatCompletion, time.Duration) {
	me.acquire()
	defer me.release()

	startTime := time.Now()
	r, err := me.openAiClient.Chat.Completions.New(x.Context, openai.ChatCompletionNewParams{
		Messages:    openai.F(memory.ToChatCompletionMessageParamUnion()),
		Temperature: openai.F(me.config.Temperature),
		Model:       openai.F(me.config.Name),
	})
	if err != nil {
		panic(errors.Wrap(err, "failed to call chat completions API"))
	}

	memory.AddAssistantMessage(r.Choices[0].Message.Content)
	return r, time.Since(startTime)
}

func buildOpenAiClient(model ModelConfig) *openai.Client {
	options := []option.RequestOption{}
	if len(model.ApiKey) > 0 {
		options = append(options, option.WithAPIKey(model.ApiKey))
	}
	if len(model.BaseUrl) > 0 {
		options = append(options, option.WithBaseURL(model.BaseUrl))
	}
	if model.Timeout.Seconds() > 0 {
		options = append(options, option.WithRequestTimeout(model.Timeout))
	}

	if len(model.ProxyUrl) > 0 {
		proxyURL, err := url.Parse(model.ProxyUrl)
		if err != nil {
			panic(fmt.Errorf("error parsing proxy URL: %+v", err))
		}

		var transport *http.Transport = nil
		if len(model.ProxyUser) == 0 {
			transport = &http.Transport{
				Proxy:           http.ProxyURL(proxyURL),
				TLSClientConfig: &tls.Config{InsecureSkipVerify: model.ProxyInsecureSkipVerify},
			}
		} else {
			dialContext := func(ctx context.Context, network, addr string) (net.Conn, error) {
				dialer := &net.Dialer{}
				conn, err := dialer.DialContext(ctx, network, proxyURL.Host)
				if err != nil {
					return nil, err
				}

				auth := model.ProxyUser + ":" + model.ProxyPass
				authBase64 := base64.StdEncoding.EncodeToString([]byte(auth))

				_, err = conn.Write([]byte("CONNECT " + addr + " HTTP/1.0\r\n"))
				if err != nil {
					return nil, err
				}
				_, err = conn.Write([]byte("Proxy-Authorization: Basic " + authBase64 + "\r\n"))
				if err != nil {
					return nil, err
				}
				_, err = conn.Write([]byte("\r\n"))
				if err != nil {
					return nil, err
				}

				buffer := make([]byte, 1024)
				n, err := conn.Read(buffer)
				if err != nil {
					return nil, err
				}
				response := string(buffer[:n])
				if !strings.Contains(response, "200 Connection established") {
					return nil, fmt.Errorf("proxy connection failed: %s", response)
				}

				return conn, nil
			}

			transport = &http.Transport{
				Proxy:           http.ProxyURL(proxyURL),
				DialContext:     dialContext,
				TLSClientConfig: &tls.Config{InsecureSkipVerify: model.ProxyInsecureSkipVerify},
			}
		}

		httpClient := &http.Client{
			Transport: transport,
		}

		options = append(options, option.WithHTTPClient(httpClient))
	}

	return openai.NewClient(options...)
}
