@extends('errors.layout')
@section('code', '404')
@section('title', app()->getLocale() === 'ar' ? 'الصفحة غير موجودة' : 'Page Not Found')
@section('message', app()->getLocale() === 'ar' ? 'الصفحة المطلوبة غير موجودة أو تم نقلها.' : 'The page you are looking for could not be found.')
