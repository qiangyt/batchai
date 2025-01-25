package rest

import (
	"context"
	"strings"

	"github.com/go-resty/resty/v2"
)

const (
	H_PFX = "x-ap-"

	M_INTERNAL_SECRET    = "sec"
	M_SUBJECT_ID         = "sid"
	M_SUPER_ADMIN        = "adm"
	M_STRING_MEMBERSHIPS = "msp"

	H_INTERNAL_SECRET = H_PFX + M_INTERNAL_SECRET
	H_SUBJECT_ID      = H_PFX + M_SUBJECT_ID
	H_SUPER_ADMIN     = H_PFX + M_SUPER_ADMIN
	H_MEMBERSHIPS     = H_PFX + M_STRING_MEMBERSHIPS
)

type ApiClientT struct {
	restyClient *resty.Client

	// internalSecret string // ampilot
	baseUrl string // http://localhost:8080

	path   string
	inited bool
}

type (
	ApiClient     = *ApiClientT
	RestyRequest  = *resty.Request
	RestyResponse = *resty.Response
)

func NewApiClient(path string) ApiClient {
	return &ApiClientT{
		path:   path,
		inited: false,
	}
}

func (me ApiClient) Path() string {
	return me.path
}

func (me ApiClient) IsInited() bool {
	return me.inited
}

func (me ApiClient) Init() {
	if me.IsInited() {
		return
	}

	me.restyClient = resty.New().
		EnableTrace().
		SetBaseURL(strings.TrimSuffix(me.baseUrl, "/")+"/"+me.path).
		// SetError(me.errorHandler).
		SetHeader("Content-Type", "application/json").
		SetHeader("Accept", "application/json")

	me.inited = true
}

func (me ApiClient) buildHeaders(ctx context.Context) map[string]string {
	headers := map[string]string{}
	// x := KontextHolder.Get(ctx)
	// if x == nil {
	// 	return headers
	// }
	// if !x.IsInternal() {
	//  headers["Authorization"] = "Bearer " + x.GetToken()
	// } else {
	// 	headers.Set(H_INTERNAL_SECRET, me.internalSecret)
	// 	headers.Set(H_SUBJECT_ID, fmt.Sprintf("%d", x.GetSubjectId()))
	// 	headers.Set(H_SUPER_ADMIN, fmt.Sprintf("%t", x.IsSuperAdmin()))
	// 	headers.Set(H_MEMBERSHIPS, me.jackson.Str(x.GetAdminMemberships()))
	// }
	return headers
}

func (me ApiClient) For(ctx context.Context) RestyRequest {
	return me.restyClient.R().
		SetContext(ctx).
		SetHeaders(me.buildHeaders(ctx))
}
