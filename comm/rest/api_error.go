package rest

import (
	"encoding/json"
	"fmt"
	"time"
)

// ErrorCode represents the specific error code.
type ErrorCode int

const (
	CANNOT_CHANGE_TENANT ErrorCode = iota + 1
	ENTITY_NOT_FOUND
	PATH_NOT_FOUND

	NOT_ALLOWED_FOR_ANONYMOUS

	MEMBERSHIP_CHANGED
	ADMIN_CHANGED
	CANNOT_DELETE_LAST_ADMIN
	SUPER_ADMIN_CHANGED
	NOT_A_MEMBER
	MEMBERSHIP_DUPLICATES

	MUST_BE_SUPER_ADMIN
	MUST_BE_TENANT_ADMIN
	NO_PERMISSION_ON_TENANT
	NO_PERMISSION_ON_SUBJECT
	NO_PERMISSION_ON_MODEL
	NO_PERMISSION_ON_VENDOR
	NO_PERMISSION_ON_PROXY

	OAUTH_CLIENT_ID_DUPLICATES
	WRONG_PASSWORD
	EMAIL_DUPLICATES
	NAME_DUPLICATES
	KEY_DUPLICATES
	CODE_DUPLICATES
	NONE
	ID_CANNOT_BE_NULL

	PROXY_IS_USED_BY_VENDOR
	PROXY_IS_USED_BY_MODEL

	// ALREADY_EXISTS
	// ALREADY_VALIDATED
	// OTHER

	/** The provided parameter is not valid. */
	PARAMETER_NOT_VALID

	/** A constraint violation occurred. */
	CONSTRAINT_VIOLATION

	/** The data format is incorrect. */
	WRONG_DATA_FORMAT

	/** The field cannot be updated. */
	FIELD_NOT_UPDATEABLE

	/** The field cannot be assigned. */
	FIELD_NOT_ASSIGNABLE

	/** The field does not exist. */
	FIELD_NOT_EXISTS

	/** The value is not a valid enum. */
	INVALID_ENUM

	/** The property is invalid. */
	INVALID_PROPERTY

	NOT_A_CLASS_FILE
)

// ErrorResponse represents an error response with details about the error.
type ErrorResponseT struct {
	Timestamp time.Time `json:"timestamp"`
	Status    int       `json:"status"`
	Error     string    `json:"error"`
	Code      ErrorCode `json:"code"`
	Message   string    `json:"message"`
	Params    []any     `json:"params"`
	Path      string    `json:"path"`
}

type ErrorResponse = *ErrorResponseT

// String returns a pretty-printed JSON string representation of the error response.
func (me ErrorResponse) String() string {
	jsonBytes, err := json.MarshalIndent(me, "", "  ")
	if err != nil {
		return fmt.Sprintf("Error marshalling to JSON: %v", err)
	}
	return string(jsonBytes)
}
