@extends('errors.layout')
@section('code', '419')
@section('title', app()->getLocale() === 'ar' ? 'انتهت صلاحية الجلسة' : 'Session Expired')
@section('message', app()->getLocale() === 'ar' ? 'انتهت صلاحية الجلسة الأمنية، يرجى تحديث الصفحة والمحاولة مجددًا.' : 'Your session expired. Please refresh and try again.')
